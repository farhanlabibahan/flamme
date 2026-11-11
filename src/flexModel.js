import model from './flexModel.json' with {type: 'json'};

/* Grounds the illustrative 3D lab in real NASA data (plan item 4: "ground
   the 3D lab in data ... the lab shows the closest real experiments next to
   the simulation"). Source: 274 individual FLEX (PSI-69) droplet-flame
   tests, cleaned + feature-engineered + fitted in
   flame_in_freefall_data/ml/build_flex_model.py (logistic + linear
   regression, both documented with honest train/test metrics in
   flexModel.json). This file only runs the already-fitted coefficients --
   no training happens in the browser.

   SCOPE: FLEX is free-floating liquid-droplet combustion (methanol/heptane),
   a different physical regime from the lab's solid-sample sheet (SIBAL,
   PMMA, Silicone). This module is deliberately NOT wired into labModel.js's
   derive() -- it is surfaced as a clearly-labeled side-by-side comparison,
   never blended into the illustrative solid-sample curves. */

const sigmoid = x => 1 / (1 + Math.exp(-x));
const standardize = (x, mean, scale) => x.map((v, i) => (v - mean[i]) / scale[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

function featuresFor({o2Pct, pressureAtm, dropletDiameterMm, fuelMethanol}) {
  // must match FEATURES order in build_flex_model.py: o2_pct, pressure_atm, o2_partial_pressure_atm, droplet_diameter_mm, fuel_methanol
  const o2PartialPressureAtm = (o2Pct / 100) * pressureAtm;
  return [o2Pct, pressureAtm, o2PartialPressureAtm, dropletDiameterMm, fuelMethanol ? 1 : 0];
}

/** "Never extrapolate silently" (Space Apps 2026 Build Guide, Flame in
 * Freefall, hard rule). Returns false the moment any feature falls outside
 * the span the model actually saw in the 273 training rows -- callers must
 * refuse to show a prediction rather than guess beyond it. */
export function inTrainingRange(scenario) {
  const x = featuresFor({dropletDiameterMm: 1.7, fuelMethanol: true, ...scenario});
  return model.features.every((name, i) => {
    const [lo, hi] = model.training_range[name];
    return x[i] >= lo && x[i] <= hi;
  });
}

/** Predicted self-extinguish probability + burning-rate constant for a
 * hypothetical droplet test at the given conditions, from the fitted FLEX
 * models (not a lookup -- genuine model inference). Returns null, never a
 * guessed number, when the scenario falls outside the training envelope. */
export function predictFlex({o2Pct, pressureAtm, dropletDiameterMm = 1.7, fuelMethanol = true}) {
  if (!inTrainingRange({o2Pct, pressureAtm, dropletDiameterMm, fuelMethanol})) return null;
  const x = featuresFor({o2Pct, pressureAtm, dropletDiameterMm, fuelMethanol});
  const c = model.classifier, r = model.regressor;
  const pExtinguish = sigmoid(dot(standardize(x, c.scaler_mean, c.scaler_scale), c.coef) + c.intercept);
  const burningRate = dot(standardize(x, r.scaler_mean, r.scaler_scale), r.coef) + r.intercept;
  return {selfExtinguishProbability: pExtinguish, burningRateK: burningRate};
}

/** The real FLEX test whose O2%/pressure are closest to the given scenario
 * -- the "closest real experiment" the plan asks the lab to surface. */
export function nearestFlexTest({o2Pct, pressureAtm}) {
  let best = null, bestDist = Infinity;
  for (const t of model.tests) {
    const d = Math.pow((t.o2_pct - o2Pct) / 10, 2) + Math.pow((t.pressure_atm - pressureAtm) / 0.3, 2);
    if (d < bestDist) { bestDist = d; best = t; }
  }
  return best;
}

export const flexModelMeta = {
  source: model.source,
  sourceUrl: model.source_url,
  scopeNote: model.scope_note,
  classifierMetrics: model.classifier.metrics,
  regressorMetrics: model.regressor.metrics,
  trainingRange: model.training_range,
  nTests: model.tests.length,
};
