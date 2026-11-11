import React from 'react';
import {ExternalLink} from 'lucide-react';
import {flexModelMeta} from '../flexModel.js';
import model from '../flexModel.json' with {type: 'json'};
import './ModelPage.css';

/* Real route: /model. Proof-of-work page: the exact fitted parameters of the
   two scikit-learn models trained in ML/build_flex_model.py, so a judge (or
   anyone) can see this is a real trained model -- not a hardcoded rule and
   not a language model guessing -- and verify the numbers against the
   training script on GitHub. */

const FEATURE_LABEL = {
  o2_pct: 'Oxygen %', pressure_atm: 'Pressure (atm)',
  o2_partial_pressure_atm: 'O₂ partial pressure (atm)',
  droplet_diameter_mm: 'Droplet diameter (mm)', fuel_methanol: 'Fuel = Methanol',
};

function CoefTable({coef, intercept, scalerMean, scalerScale}) {
  return <div className="tw md-coef"><table>
    <thead><tr><th>Feature</th><th>Mean</th><th>SD</th><th>Coefficient</th></tr></thead>
    <tbody>
      {model.features.map((f, i) => <tr key={f}>
        <td>{FEATURE_LABEL[f] || f}</td>
        <td>{scalerMean[i].toFixed(2)}</td>
        <td>{scalerScale[i].toFixed(2)}</td>
        <td className={coef[i] >= 0 ? 'md-pos' : 'md-neg'}>{coef[i].toFixed(3)}</td>
      </tr>)}
      <tr><td><b>Intercept</b></td><td/><td/><td>{intercept.toFixed(3)}</td></tr>
    </tbody>
  </table></div>;
}

export default function ModelPage() {
  const c = model.classifier, r = model.regressor;
  const [[tn, fp], [fn, tp]] = c.metrics.confusion_matrix;
  return <div className="md reveal">
    <header>
      <span className="cmp-kicker">Model</span>
      <h1>The trained model behind the Lab's FLEX predictions</h1>
      <p className="md-lede">Two scikit-learn models, fitted once on real NASA data — not a lookup table, not a language model.
        Training happens offline in <a href="https://github.com/farhanlabibahan/flamme/blob/main/ML/build_flex_model.py" target="_blank" rel="noreferrer">ML/build_flex_model.py <ExternalLink size={12}/></a>;
        the browser only runs the fitted arithmetic below (standardize → weighted sum → sigmoid).</p>
    </header>

    <section className="surface md-block">
      <h2>Training data</h2>
      <p>{flexModelMeta.nTests} individual droplet-flame tests from NASA PSI investigation <b>PSI-69 (FLEX)</b> — <a href={flexModelMeta.sourceUrl} target="_blank" rel="noreferrer">source <ExternalLink size={12}/></a>.
        Tested range: O₂ {model.training_range.o2_pct[0]}–{model.training_range.o2_pct[1]}%, pressure {model.training_range.pressure_atm[0].toFixed(2)}–{model.training_range.pressure_atm[1].toFixed(2)} atm,
        droplet {model.training_range.droplet_diameter_mm[0]}–{model.training_range.droplet_diameter_mm[1]} mm. The Lab refuses to predict outside this range rather than extrapolate.</p>
    </section>

    <section className="surface md-block">
      <h2>Self-extinguish probability</h2>
      <p className="md-summary"><b>{Math.round(c.metrics.accuracy * 100)}%</b> test accuracy, <b>{c.metrics.auc}</b> AUC
        on {c.metrics.n_train}/{c.metrics.n_test} train/test rows — AUC is the honest number here since {Math.round(c.metrics.base_rate_self_extinguish * 100)}%
        of tests self-extinguish already, so accuracy alone would reward just guessing the majority class.</p>
      <div className="tw md-cm"><table>
        <thead><tr><th/><th>Predicted: burned out</th><th>Predicted: extinguished</th></tr></thead>
        <tbody>
          <tr><th scope="row">Actual: burned out</th><td>{tn}</td><td>{fp}</td></tr>
          <tr><th scope="row">Actual: extinguished</th><td>{fn}</td><td>{tp}</td></tr>
        </tbody>
      </table></div>
      <CoefTable coef={c.coef} intercept={c.intercept} scalerMean={c.scaler_mean} scalerScale={c.scaler_scale}/>
    </section>

    <section className="surface md-block">
      <h2>Burning-rate constant K</h2>
      <p className="md-summary"><b>R² {r.metrics.r2}</b>, MAE {r.metrics.mae_mm2_s} mm²/s on {r.metrics.n_train}/{r.metrics.n_test} train/test rows.</p>
      <CoefTable coef={r.coef} intercept={r.intercept} scalerMean={r.scaler_mean} scalerScale={r.scaler_scale}/>
    </section>

    <p className="md-footnote">At inference (<code>src/flexModel.js</code>): each feature is standardized, multiplied by its coefficient above,
      summed with the intercept, and — for the classifier only — passed through a sigmoid. That's the whole model.</p>
  </div>;
}
