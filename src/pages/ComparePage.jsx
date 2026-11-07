import React from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, Info, Layers, X} from 'lucide-react';
import {useFlamme, value} from '../context/FlammeContext.jsx';

/* Real route: /compare. A table: one row per property, one column per record. */
const ROWS = [
  ['Gravity', r => r.environment.gravity],
  ['Oxygen', r => r.environment.oxygen],
  ['Airflow', r => r.flow.speed],
  ['Flow direction', r => r.flow.direction],
  ['Pressure', r => r.environment.pressure],
  ['Thickness', r => r.sample.thickness],
  ['Length', r => r.sample.length],
  ['Width', r => r.sample.width],
  ['Ignition power', r => r.ignition.power],
  ['Ignition time', r => r.ignition.duration],
  ['Burn-time entry', r => r.measurements.burn],
  ['Spread entry*', r => r.measurements.spread],
];

export default function ComparePage() {
  const {compare, experiments, toggleCompare, openSource} = useFlamme();
  const navigate = useNavigate();
  const records = compare.map(id => experiments.find(x => x.id === id)).filter(Boolean);

  return <div className="cmp reveal">
    <header className="cmp-head">
      <div>
        <span className="cmp-kicker">Compare</span>
        <h1>Side by side</h1>
        <p>Differences stay visible. A missing value is shown as unknown, never as equal.</p>
      </div>
      <button className="cmp-ghost" onClick={() => navigate('/evidence')}>Add records</button>
    </header>

    {records.length < 2 ? <div className="cmp-empty">
      <Layers size={22}/>
      <h2>Pick at least two records</h2>
      <p>Tick records on the Evidence page. You can compare up to three.</p>
      <button className="cmp-primary" onClick={() => navigate('/evidence')}>Go to Evidence <ArrowRight size={16}/></button>
    </div> : <div className="cmp-table-wrap">
      <table className="cmp-table">
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Property</span></th>
            {records.map(r => <th scope="col" key={r.id}>
              <div className="cmp-col">
                <span className="cmp-id">{r.id}</span>
                <strong>{r.sample.material}</strong>
                <small>{r.investigationId === 'PSI-99' ? 'Saffire II' : 'BASS II'}</small>
                <button className="cmp-remove" aria-label={`Remove ${r.id}`} onClick={() => toggleCompare(r.id)}><X size={13}/></button>
              </div>
            </th>)}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, get]) => <tr key={label}>
            <th scope="row">{label}</th>
            {records.map(r => <td key={r.id}>{value(get(r))}</td>)}
          </tr>)}
          <tr className="cmp-source-row">
            <th scope="row">Source</th>
            {records.map(r => <td key={r.id}><button className="cmp-link" onClick={() => openSource(r.id)}>Row {r.source.row}</button></td>)}
          </tr>
        </tbody>
      </table>
    </div>}

    <p className="cmp-foot"><Info size={14}/> *Saffire II's "µ-g Spread Length" column holds a value in mm/s for sample 2-5. It is kept as written and flagged here.</p>
  </div>;
}
