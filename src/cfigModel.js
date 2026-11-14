// SI disclosure: written with Claude (Anthropic); coefficients come from ML/build_cfig_model.py.
import model from './cfigModel.json' with {type: 'json'};

/* Second trained model (ML/build_cfig_model.py): probability that a gaseous-fuel
   flame hot-ignites in the ACME CFI-G tests (PSI-159), by O2, pressure, fuel
   family and flame configuration. 'normal' = ambient atmosphere (O2 ~18-40%);
   'inverse' = oxidiser fed from the burner (O2 12-85%, the highest-oxygen
   microgravity tests in PSI). Same rules as flexModel.js: coefficients only, no
   training in the browser, and null (never a guess) outside the tested envelope
   of the chosen flame configuration. */
const sigmoid = x => 1 / (1 + Math.exp(-x));
const FUELS = ['butane', 'propane', 'ethane'];
export const FLAMES = ['normal', 'inverse'];
const feats = ({o2Pct, pressureBar, fuel, flame}) => [o2Pct, pressureBar, fuel === 'propane' ? 1 : 0, fuel === 'ethane' ? 1 : 0, flame === 'inverse' ? 1 : 0];

export function inCfigRange({o2Pct, pressureBar, flame = 'normal'}) {
  const r = model.training_range_by_flame[flame];
  return !!r && o2Pct >= r.o2_pct[0] && o2Pct <= r.o2_pct[1] && pressureBar >= r.p_bar[0] && pressureBar <= r.p_bar[1];
}

/** {fuel: probability of hot ignition} for each fuel family, or null outside the flame configuration's training range. */
export function predictCfig({o2Pct, pressureBar, flame = 'normal'}) {
  if (!inCfigRange({o2Pct, pressureBar, flame})) return null;
  const c = model.classifier;
  return Object.fromEntries(FUELS.map(fuel => {
    const x = feats({o2Pct, pressureBar, fuel, flame});
    const z = x.reduce((s, v, i) => s + ((v - c.scaler_mean[i]) / c.scaler_scale[i]) * c.coef[i], c.intercept);
    return [fuel, sigmoid(z)];
  }));
}

/** Closest real test of the same flame configuration (by O2 and pressure). */
export function nearestCfigTest({o2Pct, pressureBar, flame = 'normal'}) {
  let best = null, bestD = Infinity;
  for (const t of model.tests) {
    if (t.flame !== flame) continue;
    const d = ((t.o2_pct - o2Pct) / 10) ** 2 + ((t.pressure_bar - pressureBar) / 0.5) ** 2;
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}

export const cfigModelMeta = {
  metrics: model.classifier.metrics, trainingRange: model.training_range, rangeByFlame: model.training_range_by_flame,
  scopeNote: model.scope_note, sourceUrl: model.source_url, nTests: model.tests.length,
  nByFlame: Object.fromEntries(FLAMES.map(f => [f, model.tests.filter(t => t.flame === f).length])),
};
