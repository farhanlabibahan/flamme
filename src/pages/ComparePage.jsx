import React from 'react';
import {ExternalLink, Info} from 'lucide-react';
import {useFlamme, value} from '../context/FlammeContext.jsx';

/* Real route: /compare. */
export default function ComparePage() {
  const {compare, experiments, openSource} = useFlamme();
  return <section className="comparison-page" id="comparison">
    <div className="comparison-intro"><h1>Compare observations.<br/><span>Keep the differences visible.</span></h1></div>
    <div className="compare-warning"><Info size={18}/><span>An unknown value is never treated as equal.</span></div>
    {compare.length < 2 ? <div className="empty-result">Choose at least two records in Evidence to compare them.</div> : <div className="compare-cards">
      {compare.map(id => {
        const r = experiments.find(x => x.id === id);
        if (!r) return null;
        return <article className="surface compare-card" key={id}>
          <small>{r.investigationId} / {r.id}</small>
          <h2>{r.sample.material}</h2>
          {[['Gravity', r.environment.gravity], ['Oxygen', r.environment.oxygen], ['Airflow', r.flow.speed], ['Flow direction', r.flow.direction], ['Pressure', r.environment.pressure], ['Thickness', r.sample.thickness], ['Sample length', r.sample.length], ['Width', r.sample.width], ['Ignition power', r.ignition.power], ['Ignition time', r.ignition.duration], ['Burn-time entry', r.measurements.burn], ['Spread-column entry*', r.measurements.spread]].map(([name, f]) => <div className="compare-line" key={name}><span>{name}</span><b>{value(f)}</b></div>)}
          <button className="outline-btn" onClick={() => openSource(id)}>Source row {r.source.row} <ExternalLink size={14}/></button>
        </article>;
      })}
    </div>}
    <p className="compare-footnote">* Saffire II's "µ-g Spread Length" column contains a value in mm/s for sample 2-5 — preserved as-is, flagged here.</p>
  </section>;
}
