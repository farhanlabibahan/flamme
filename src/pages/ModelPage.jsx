import React from 'react';
import {ExternalLink, FileJson, FileSpreadsheet} from 'lucide-react';
import Mermaid from '../components/Mermaid.jsx';
import {CoefBarChart, ScatterChart} from '../components/Charts.jsx';
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

const PIPELINE = `flowchart LR
  A["\`NASA PSI-69 FLEX
**~24,500** raw rows\`"] --> B["\`Pivot + clean
**274** tests\`"]
  B --> C["\`Feature engineering
**5** features\`"]
  C --> D["StandardScaler"]
  D --> E["\`LogisticRegression
self-extinguish\`"]
  D --> F["\`LinearRegression
burning rate K\`"]
  E --> G["\`Held-out test
AUC **0.895**\`"]
  F --> H["\`Held-out test
R\u00b2 **0.582**\`"]
  G --> I["\`flexModel.json
plain coefficients\`"]
  H --> I
  I --> J["\`Client-side inference
in the Lab\`"]`;

const INFERENCE = `flowchart LR
  S["slider value"] --> Z["\`standardize
(x - mean) / sd\`"]
  Z --> W["\`\u00d7 coefficient
+ intercept\`"]
  W --> P{"classifier?"}
  P -->|"yes"| SIG["\`sigmoid \u2192
probability\`"]
  P -->|"no"| OUT["burning rate K"]`;

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

/* The 10-condition reporting schema (plan item 5): every other page in
   Flamme already reports data in this format, so it lives here with the
   model it feeds rather than as a separate stop in the nav. */
export const CONDITIONS = [
  {n: 1, key: 'material', name: 'Material / fuel', rep: 'Material name, formulation, coating, substrate', type: 'string'},
  {n: 2, key: 'geometry_mm', name: 'Sample geometry', rep: 'Length × width × thickness (mm)', type: 'string (3 numbers, mm)'},
  {n: 3, key: 'gravity', name: 'Gravity', rep: 'Earth, partial, microgravity; g level', type: 'enum + number (g)'},
  {n: 4, key: 'oxygen_pct', name: 'Oxygen concentration', rep: '% O2 by volume', type: 'number (0–100)'},
  {n: 5, key: 'pressure_kpa', name: 'Total pressure', rep: 'kPa', type: 'number'},
  {n: 6, key: 'airflow_cm_s', name: 'Forced airflow', rep: 'cm/s', type: 'number'},
  {n: 7, key: 'flow_direction', name: 'Flow direction', rep: 'Concurrent, opposed, cross-flow', type: 'enum'},
  {n: 8, key: 'ignition', name: 'Ignition', rep: 'Igniter type, power, duration, position', type: 'string + number (W, s)'},
  {n: 9, key: 'initial_temp', name: 'Initial temperature', rep: '°C or K', type: 'number'},
  {n: 10, key: 'suppression', name: 'Suppression', rep: 'Agent, concentration, flow rate, timing', type: 'string + numbers'},
];

const SCHEMA = {
  '$schema': 'https://json-schema.org/draft/2020-12/schema',
  title: 'Flamme microgravity combustion test record',
  type: 'object',
  required: ['record_id', 'source', ...CONDITIONS.map(c => c.key)],
  properties: {
    record_id: {type: 'string', description: 'Unique ID for this test/record'},
    source: {type: 'object', properties: {
      investigation: {type: 'string'}, url: {type: 'string', format: 'uri'},
      file: {type: 'string'}, row: {type: ['integer', 'null']},
    }},
    ...Object.fromEntries(CONDITIONS.map(c => [c.key, {
      description: c.rep,
      oneOf: [{type: c.type.includes('number') ? 'number' : 'string'}, {type: 'null', description: 'use null, never 0 or blank, when not reported'}],
    }])),
    notes: {type: 'string', description: 'Anything the ten fields above cannot capture'},
  },
};

function downloadFile(filename, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: mime}));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

const csvTemplate = () => {
  const header = ['record_id', 'source_investigation', 'source_url', 'source_file', 'source_row', ...CONDITIONS.map(c => c.key), 'notes'];
  const example = ['EXAMPLE-1', 'PSI-69', 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69', 'FLEX_table.csv', '2',
    'Heptane', '5x5x0.5', 'microgravity', '18', '101.3', '0', 'opposed', 'hot wire, 20 W, 2 s', '296', 'none', 'leave a field blank, never 0, when the source does not report it'];
  return [header, example].map(row => row.map(v => /[,"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n');
};

export default function ModelPage() {
  const c = model.classifier, r = model.regressor;
  const [[tn, fp], [fn, tp]] = c.metrics.confusion_matrix;
  const scatterPoints = model.tests.map(t => ({
    ...t, o2_partial_pressure_atm: (t.o2_pct / 100) * t.pressure_atm,
  }));

  return <div className="md reveal">
    <header>
      <span className="cmp-kicker">Model</span>
      <h1>The trained model behind the Lab</h1>
      <p className="md-lede">Trained offline in <a href="https://github.com/farhanlabibahan/flamme/blob/main/ML/build_flex_model.py" target="_blank" rel="noreferrer">ML/build_flex_model.py <ExternalLink size={14}/></a>. A second, smaller model (CFI-G hot ignition, gaseous fuels, normal and inverse flames up to 85% O₂; held-out AUC 0.83, but no better than always guessing “ignites” on accuracy) is trained in <a href="https://github.com/farhanlabibahan/flamme/blob/main/ML/build_cfig_model.py" target="_blank" rel="noreferrer">ML/build_cfig_model.py <ExternalLink size={14}/></a> and shown on the Lab page; this page documents the FLEX model.</p>
    </header>

    <section className="surface md-diagram">
      <Mermaid chart={PIPELINE} className="md-mmd"/>
    </section>

    <section className="surface md-card">
      <div className="md-block">
        <h2 className="md-eyebrow">Data</h2>
        <p><b>{flexModelMeta.nTests}</b> individual droplet-flame tests from NASA PSI investigation <b>PSI-69 (FLEX)</b> — <a href={flexModelMeta.sourceUrl} target="_blank" rel="noreferrer">source <ExternalLink size={12}/></a>, pivoted
          out of a ~24,500-row long-format export (one row per measurement) into one row per physical test.
          Tested range: O₂ <b>{model.training_range.o2_pct[0]}–{model.training_range.o2_pct[1]}%</b>, pressure <b>{model.training_range.pressure_atm[0].toFixed(2)}–{model.training_range.pressure_atm[1].toFixed(2)} atm</b>,
          droplet <b>{model.training_range.droplet_diameter_mm[0]}–{model.training_range.droplet_diameter_mm[1]} mm</b> — the Lab refuses to predict outside it rather than extrapolate.</p>
        <ScatterChart points={scatterPoints} xKey="o2_partial_pressure_atm" yKey="burning_rate_k_mm2_s"
          xLabel="O₂ partial pressure (atm)" yLabel="Burning rate K (mm²/s)"/>
        <p className="md-caption">Every point is a real PSI-69 test, not a simulation — this is what the model actually trained on.</p>
      </div>

      <div className="md-block">
        <h2 className="md-eyebrow">Cleaning</h2>
        <p>Pressure converted mmHg → atm. The self-extinguish target is <b>derived, not assumed</b>:</p>
        <ul className="md-rules">
          <li>numeric extinction diameter reported → <b>1</b> (flame measurably shrank to extinction)</li>
          <li>source explicitly marks "burned to completion" → <b>0</b></li>
          <li>unreported / ambiguous → left missing, <b>never guessed</b></li>
        </ul>
        <p>One row had a literal <code>0 mmHg</code> reading — impossible for a sealed chamber — fixed to missing rather than
          near-vacuum; that single fix raised the burning-rate R² from <b>0.45</b> to <b>0.58</b>, which is the evidence the fix was
          correct, not just tidier-looking data.</p>
      </div>

      <div className="md-block">
        <h2 className="md-eyebrow">Feature engineering</h2>
        <Table head={['Feature', 'Why it is in the model']} rows={
          model.features.map(f => <tr key={f}><td>{FEATURE_LABEL[f]}</td><td>{FEATURE_WHY[f]}</td></tr>)
        }/>
      </div>

      <div className="md-block">
        <h2 className="md-eyebrow">Why logistic / linear regression</h2>
        <p>n=<b>{flexModelMeta.nTests}</b> is too small for gradient boosting or a neural net — they'd mostly fit noise. Linear models keep
          every coefficient interpretable, and logistic regression gives the calibrated probability the Lab needs.</p>
      </div>

      <div className="md-block">
        <h2 className="md-eyebrow">Self-extinguish probability</h2>
        <p className="md-summary"><b>{Math.round(c.metrics.accuracy * 100)}%</b> accuracy, <b>{c.metrics.auc}</b> AUC on <b>{c.metrics.n_train}/{c.metrics.n_test}</b> train/test rows —
          AUC is the honest number since <b>{Math.round(c.metrics.base_rate_self_extinguish * 100)}%</b> of tests self-extinguish already.</p>
        <Table head={['', 'Predicted: burned out', 'Predicted: extinguished']} rows={<>
          <tr><th scope="row">Actual: burned out</th><td>{tn}</td><td>{fp}</td></tr>
          <tr><th scope="row">Actual: extinguished</th><td>{fn}</td><td>{tp}</td></tr>
        </>}/>
        <p className="md-caption">Fitted coefficients — bar length is magnitude, color is sign:</p>
        <CoefBarChart features={model.features} labels={FEATURE_LABEL} coef={c.coef}/>
        <Table head={['Feature', 'Fitted coefficient']} rows={<CoefRows coef={c.coef} intercept={c.intercept}/>}/>
      </div>

      <div className="md-block">
        <h2 className="md-eyebrow">Burning-rate constant K</h2>
        <p className="md-summary"><b>R² {r.metrics.r2}</b>, MAE <b>{r.metrics.mae_mm2_s} mm²/s</b> on <b>{r.metrics.n_train}/{r.metrics.n_test}</b> train/test rows.</p>
        <CoefBarChart features={model.features} labels={FEATURE_LABEL} coef={r.coef}/>
        <Table head={['Feature', 'Fitted coefficient']} rows={<CoefRows coef={r.coef} intercept={r.intercept}/>}/>
      </div>

      <div className="md-block">
        <h2 className="md-eyebrow">Using it</h2>
        <Mermaid chart={INFERENCE} className="md-mmd md-mmd-sm"/>
        <p>No training happens in the browser — <code>src/flexModel.js</code> just runs the diagram above. Open{' '}
          <a href="/lab">the Lab</a> and move the oxygen or pressure sliders: the "Grounded in NASA FLEX data" card runs this exact
          arithmetic live, and shows "outside the tested envelope" the moment you leave the range above.</p>
      </div>

      <div className="md-block">
        <h2 className="md-eyebrow">Reporting template</h2>
        <p>Every value this model trained on, and every page in Flamme, reports conditions in the same 10-field format. A blank
          field means "not reported" — it must never be guessed or defaulted to zero.</p>
        <div className="md-dl">
          <button onClick={() => downloadFile('flamme-test-record.schema.json', JSON.stringify(SCHEMA, null, 2), 'application/json')}>
            <FileJson size={15}/> Download JSON Schema</button>
          <button onClick={() => downloadFile('flamme-test-record-template.csv', csvTemplate(), 'text/csv')}>
            <FileSpreadsheet size={15}/> Download CSV template</button>
        </div>
        <div className="md-cond-grid">
          {CONDITIONS.map(cond => <div className="md-cond" key={cond.n}>
            <span className="md-cond-n">{String(cond.n).padStart(2, '0')}</span>
            <div><b>{cond.name}</b><span>{cond.rep}</span></div>
          </div>)}
        </div>
      </div>
    </section>
  </div>;
}
