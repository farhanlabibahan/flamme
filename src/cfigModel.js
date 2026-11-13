import model from './cfigModel.json' with {type: 'json'};

/* Second trained model (ML/build_cfig_model.py): probability that a gaseous-fuel
   flame hot-ignites in the ACME CFI-G normal-flame tests (PSI-159), by O2,
   pressure and fuel family. Same rules as flexModel.js: coefficients only, no
   training in the browser, and null (never a guess) outside the tested envelope. */
const sigmoid = x => 1 / (1 + Math.exp(-x));
const FUELS = ['butane', 'propane', 'ethane'];
const feats = ({o2Pct, pressureBar, fuel}) => [o2Pct, pressureBar, fuel === 'propane' ? 1 : 0, fuel === 'ethane' ? 1 : 0];

export function inCfigRange({o2Pct, pressureBar}) {
  const r = model.training_range;
  return o2Pct >= r.o2_pct[0] && o2Pct <= r.o2_pct[1] && pressureBar >= r.p_bar[0] && pressureBar <= r.p_bar[1];
}

/** {fuel: probability of hot ignition} for each fuel family, or null outside the training range. */
export function predictCfig({o2Pct, pressureBar}) {
  if (!inCfigRange({o2Pct, pressureBar})) return null;
  const c = model.classifier;
  return Object.fromEntries(FUELS.map(fuel => {
    const x = feats({o2Pct, pressureBar, fuel});
    const z = x.reduce((s, v, i) => s + ((v - c.scaler_mean[i]) / c.scaler_scale[i]) * c.coef[i], c.intercept);
    return [fuel, sigmoid(z)];
  }));
}

export function nearestCfigTest({o2Pct, pressureBar}) {
  let best = null, bestD = Infinity;
  for (const t of model.tests) {
    const d = ((t.o2_pct - o2Pct) / 10) ** 2 + ((t.pressure_bar - pressureBar) / 0.5) ** 2;
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}

export const cfigModelMeta = {metrics: model.classifier.metrics, trainingRange: model.training_range, scopeNote: model.scope_note, sourceUrl: model.source_url, nTests: model.tests.length};
