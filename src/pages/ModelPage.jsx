import React from 'react';
import {ArrowRight, ExternalLink} from 'lucide-react';
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
const FEATURE_WHY = {
  o2_pct: 'Primary driver of flammability — direct oxidizer availability.',
  pressure_atm: 'Total ambient pressure affects flame temperature and mass-transfer rate.',
  o2_partial_pressure_atm: 'O₂% × pressure — combustion cares about oxidizer partial pressure, not the two terms separately.',
  droplet_diameter_mm: 'Governs the d²-law burning-rate relationship and total fuel available before burnout.',
  fuel_methanol: 'Methanol and heptane have different flame chemistry and sooting behavior.',
};

const STEPS = [
  {n: '01', t: 'Raw PSI export', d: '~24,500 long-format rows, 22 tables'},
  {n: '02', t: 'Pivot + clean', d: '274 tests, one bad reading fixed'},
  {n: '03', t: 'Feature engineer', d: '5 physically-grounded inputs'},
  {n: '04', t: 'Train + validate', d: 'Logistic + linear regression, held-out test'},
  {n: '05', t: 'Export coefficients', d: 'Plain JSON, no backend'},
  {n: '06', t: 'Run in the Lab', d: 'Client-side inference + range guard'},
];

function Table({head, rows}) {
  return <table className="md-table">
    <thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
    <tbody>{rows}</tbody>
  </table>;
}

function CoefRows({coef, intercept}) {
  return <>
    {model.features.map((f, i) => <tr key={f}>
      <td>{FEATURE_LABEL[f] || f}</td>
      <td className={coef[i] >= 0 ? 'md-pos' : 'md-neg'}>{coef[i] >= 0 ? '+' : ''}{coef[i].toFixed(3)}</td>
    </tr>)}
    <tr className="md-intercept"><td>Intercept</td><td>{intercept.toFixed(3)}</td></tr>
  </>;
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
        the browser only runs the fitted arithmetic you can see below.</p>
    </header>

    <section className="surface md-flow">
      {STEPS.map((s, i) => <React.Fragment key={s.n}>
        <div className="md-step">
          <span className="md-step-n">{s.n}</span>
          <b>{s.t}</b>
          <small>{s.d}</small>
        </div>
        {i < STEPS.length - 1 && <ArrowRight className="md-arrow" size={16}/>}
      </React.Fragment>)}
    </section>

    <section className="surface md-card">
      <div className="md-block">
        <span className="md-eyebrow">01 · Data</span>
        <p>{flexModelMeta.nTests} individual droplet-flame tests from NASA PSI investigation <b>PSI-69 (FLEX)</b> — <a href={flexModelMeta.sourceUrl} target="_blank" rel="noreferrer">source <ExternalLink size={12}/></a>,
          pivoted out of the ~24,500-row raw PSI export. Tested range: O₂ {model.training_range.o2_pct[0]}–{model.training_range.o2_pct[1]}%,
          pressure {model.training_range.pressure_atm[0].toFixed(2)}–{model.training_range.pressure_atm[1].toFixed(2)} atm, droplet {model.training_range.droplet_diameter_mm[0]}–{model.training_range.droplet_diameter_mm[1]} mm.
          The Lab refuses to predict outside this range rather than extrapolate.</p>
      </div>

      <div className="md-block">
        <span className="md-eyebrow">02 · Cleaning</span>
        <p>Pressure converted mmHg → atm; the self-extinguish target is derived, not assumed — 1 if the source reports a numeric
          extinction diameter, 0 if it explicitly marks none, and left missing (never guessed) when unreported. One row had a
          literal <code>0 mmHg</code> reading — physically impossible for a sealed chamber — fixed to missing rather than treated
          as near-vacuum; that single fix raised the burning-rate model's R² from 0.45 to 0.58.</p>
      </div>

      <div className="md-block">
        <span className="md-eyebrow">03 · Feature engineering</span>
        <Table head={['Feature', 'Why it is in the model']} rows={
          model.features.map(f => <tr key={f}><td>{FEATURE_LABEL[f]}</td><td>{FEATURE_WHY[f]}</td></tr>)
        }/>
      </div>

      <div className="md-block">
        <span className="md-eyebrow">04 · Why logistic / linear regression</span>
        <p>n={flexModelMeta.nTests} is too small for anything with more capacity — gradient boosting or a neural net would mostly
          fit noise. Coefficients stay directly interpretable (sign and size per feature, in the tables below), and logistic
          regression gives the calibrated probability the Lab actually needs.</p>
      </div>

      <div className="md-block">
        <span className="md-eyebrow">05 · Self-extinguish probability</span>
        <p className="md-summary"><b>{Math.round(c.metrics.accuracy * 100)}%</b> test accuracy, <b>{c.metrics.auc}</b> AUC on {c.metrics.n_train}/{c.metrics.n_test} train/test rows —
          AUC is the honest number since {Math.round(c.metrics.base_rate_self_extinguish * 100)}% of tests self-extinguish already, so accuracy alone would just reward guessing the majority class.</p>
        <Table head={['', 'Predicted: burned out', 'Predicted: extinguished']} rows={<>
          <tr><th scope="row">Actual: burned out</th><td>{tn}</td><td>{fp}</td></tr>
          <tr><th scope="row">Actual: extinguished</th><td>{fn}</td><td>{tp}</td></tr>
        </>}/>
        <Table head={['Feature', 'Fitted coefficient']} rows={<CoefRows coef={c.coef} intercept={c.intercept}/>}/>
      </div>

      <div className="md-block">
        <span className="md-eyebrow">06 · Burning-rate constant K</span>
        <p className="md-summary"><b>R² {r.metrics.r2}</b>, MAE {r.metrics.mae_mm2_s} mm²/s on {r.metrics.n_train}/{r.metrics.n_test} train/test rows.</p>
        <Table head={['Feature', 'Fitted coefficient']} rows={<CoefRows coef={r.coef} intercept={r.intercept}/>}/>
      </div>

      <div className="md-block">
        <span className="md-eyebrow">07 · Using the model</span>
        <p>At inference (<code>src/flexModel.js</code>): each feature is standardized, multiplied by its coefficient above, summed with
          the intercept, and — for the classifier only — passed through a sigmoid. No training happens in the browser. Open{' '}
          <a href="/lab">the Lab</a> and move the oxygen or pressure sliders — the "Grounded in NASA FLEX data" card runs this exact
          arithmetic live, and falls back to "outside the tested envelope" the moment you leave the range above.</p>
      </div>
    </section>
  </div>;
}
