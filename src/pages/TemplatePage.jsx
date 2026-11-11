import React from 'react';
import {Download, FileJson, FileSpreadsheet} from 'lucide-react';
import './TemplatePage.css';

/* Real route: /template. Plan item 5 ("A reporting template"): publish the
   ten-condition format as a simple template + machine-readable schema, so
   future experiments can report their conditions completely from the start. */

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

function download(filename, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: mime}));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

const csvTemplate = () => {
  const header = ['record_id', 'source_investigation', 'source_url', 'source_file', 'source_row', ...CONDITIONS.map(c => c.key), 'notes'];
  const example = ['EXAMPLE-1', 'PSI-69', 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69', 'FLEX_table.csv', '2',
    'Heptane', '5x5x0.5', 'microgravity', '18', '101.3', '0', 'opposed', 'hot wire, 20 W, 2 s', '296', 'none', 'leave a field blank, never 0, when the source does not report it'];
  return [header, example].map(r => r.map(v => /[,"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n');
};

export default function TemplatePage() {
  return <div className="tp reveal">
    <header>
      <span className="cmp-kicker">Reporting template</span>
      <h1>Write every future test the same way</h1>
      <p className="tp-lede">The ten conditions behind every page in Flamme, published as a plain template and a
        machine-readable JSON Schema. A field left blank/null means "not reported" — it must never be guessed or defaulted to
        zero, the same rule the evidence database and the cleaning pipeline already enforce.</p>
      <div className="tp-actions">
        <button onClick={() => download('flamme-test-record.schema.json', JSON.stringify(SCHEMA, null, 2), 'application/json')}>
          <FileJson size={15}/> Download JSON Schema</button>
        <button onClick={() => download('flamme-test-record-template.csv', csvTemplate(), 'text/csv')}>
          <FileSpreadsheet size={15}/> Download CSV template</button>
      </div>
    </header>

    <section className="surface tp-table-wrap">
      <table className="tp-table">
        <thead><tr><th>#</th><th>Condition</th><th>Standard representation</th><th>Field type</th></tr></thead>
        <tbody>{CONDITIONS.map(c => <tr key={c.n}>
          <td>{c.n}</td><td><b>{c.name}</b><br/><code>{c.key}</code></td><td>{c.rep}</td><td className="tp-type">{c.type}</td>
        </tr>)}</tbody>
      </table>
    </section>

    <section className="surface tp-notes">
      <h2>Rules for filling it in</h2>
      <ul>
        <li>Record the condition you actually controlled or measured, in the stated unit — convert once at entry, not downstream.</li>
        <li>Leave a field <code>null</code>/blank when the source does not report it. Do not infer, average, or default to a "typical" value.</li>
        <li>If the source gives a range (e.g. an O2 sweep), record both ends; Flamme's tools compute the midpoint and flag range width themselves — raw ranges should not be collapsed before they reach the database.</li>
        <li>Always carry the source: investigation ID, a direct URL, the file name, and the row/page the value came from. Every page in Flamme traces a value back to this chain.</li>
        <li>One row = one test/sample, not one investigation. A test with a before/after or micro-g-vs-1-g comparison is two rows, cross-referenced by a shared <code>record_id</code> prefix.</li>
      </ul>
      <p className="tp-foot"><Download size={13}/> Both downloads above are generated client-side from this page's source — they can't drift out of sync with the table.</p>
    </section>
  </div>;
}
