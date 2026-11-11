import React from 'react';
import {ArrowRight, ChevronDown, Search, ShieldCheck} from 'lucide-react';
import {useFlamme, value} from '../context/FlammeContext.jsx';

/* Every single-material family named in the catalog (findingsData.json, the
   same data the model and Rankings use). Mixtures and generic descriptions are
   left out. A material with no Evidence record shows zero matches. */
const MATERIAL_OPTIONS = [
  'Cotton–fiberglass (SIBAL)', 'Silicone', 'PMMA', 'Nomex', 'Teflon', 'Kapton', 'Pyrell',
  'Lampwick', 'Cotton jersey', 'Wax', 'Heptane', 'Methanol', 'Ethanol', 'Decane', 'Dodecane',
  'DME', 'Methane', 'Ethane', 'Ethylene', 'Propane', 'Butane', 'Propylene', 'Paper',
].map(m => [m, m]);

/* Real route: /evidence. Click a row to open it in the detail panel. */
export default function EvidencePage() {
  const {
    scenario, update, results, selected, setSelected,
    query, setQuery, filter, setFilter, investigations, record, source, brief,
    setSearched, ranked, openSource,
  } = useFlamme();

  const select = (label, key, items) => <label className="ev-field">
    <span>{label}</span>
    <select value={scenario[key]} onChange={e => update(key, e.target.value)}>{items.map(([v, t]) => <option value={v} key={v}>{t}</option>)}</select>
  </label>;

  const numField = (label, key, {step, unit}) => <label className="ev-field">
    <span>{label}</span>
    <input type="number" inputMode="decimal" step={step} placeholder={`Any${unit ? ` (${unit})` : ''}`}
      value={scenario[key]} onChange={e => update(key, e.target.value)}/>
  </label>;

  return <div className="ev reveal">
    <header className="ev-head">
      <div>
        <span className="ev-kicker">Evidence</span>
        <h1>Find the record that fits</h1>
        <p>Set a scenario, then open a record to read it.</p>
      </div>
      <button className="ev-primary" onClick={() => { setSearched(true); setSelected(ranked[0].record.id); document.getElementById('ev-list')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }}>
        Best match <ArrowRight size={16}/>
      </button>
    </header>

    <div className="ev-filters" id="scenario">
      {select('Material', 'material', [['', 'Any'], ...MATERIAL_OPTIONS])}
      {numField('Oxygen', 'oxygen', {step: '0.1', unit: '%'})}
      {numField('Airflow', 'airflow', {step: '1', unit: 'cm/s'})}
      {select('Flow direction', 'direction', [['', 'Any'], ['Concurrent', 'Concurrent'], ['Opposed', 'Opposed']])}
    </div>
    <div className="ev-filters">
      {numField('Sample width', 'geometry', {step: '0.5', unit: 'cm'})}
      {select('Outcome', 'outcome', [['spread', 'Spread-column entry'], ['burn', 'Burn-time entry'], ['burnLength', 'Burn length'], ['smoke', 'Smoke / particles'], ['heat', 'Heat release']])}
      <p className="ev-note"><ShieldCheck size={13}/> Missing inputs are never assumed.</p>
    </div>

    <div className="ev-split">
      <section className="ev-list" id="ev-list" aria-label="Matching records">
        <div className="ev-list-top">
          <label className="ev-search"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search material or ID" aria-label="Search evidence"/></label>
          <select aria-label="Investigation" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="All">All sources</option>
            {investigations.map(i => <option value={i.id} key={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="ev-count">{results.length} record{results.length === 1 ? '' : 's'}</div>

        {results.length === 0 ? <div className="ev-empty">No records match this scenario.</div> : results.map(({record: r, matched}) => {
          const isOpen = selected === r.id;
          return <div key={r.id} className={`ev-row ${isOpen ? 'open' : ''}`}>
            <button className="ev-row-main" onClick={() => setSelected(r.id)} aria-pressed={isOpen}>
              <span className="ev-row-id">{r.id}</span>
              <span className="ev-row-body">
                <strong>{r.sample.material}</strong>
                <small>{r.investigationId === 'PSI-99' ? 'Saffire II' : 'BASS II'} · {value(r.environment.oxygen)} O₂ · {value(r.flow.speed)}</small>
              </span>
              <span className="ev-row-match">{matched} match</span>
            </button>
          </div>;
        })}
      </section>

      <aside className="ev-detail" aria-label="Selected record">
        <div className="ev-detail-top">
          <span className="ev-kicker">{record.id} · {source.name}</span>
          <h2>{record.sample.material}</h2>
          <p>{source.platform} · row {record.source.row}</p>
        </div>

        <div className="ev-block">
          <span className="ev-label">Observed</span>
          <p>{brief.observed}</p>
          {record.investigationId === 'PSI-99' && <dl className="ev-stats">
            <div><dt>Burn time</dt><dd>{value(record.measurements.burn)}</dd></div>
            <div><dt>Spread entry*</dt><dd>{value(record.measurements.spread)}</dd></div>
          </dl>}
        </div>
        <div className="ev-block"><span className="ev-label">Interpretation</span><p>{brief.interpretation}</p></div>
        <div className="ev-block ev-caution"><span className="ev-label">Unknowns &amp; limits</span><p>{brief.limitations}</p></div>

        <details className="ev-raw">
          <summary>Original conditions <ChevronDown size={14}/></summary>
          <dl>
            {[['Thickness', record.sample.thickness], ['Length', record.sample.length], ['Width', record.sample.width], ['Oxygen', record.environment.oxygen], ['Pressure', record.environment.pressure], ['Airflow', record.flow.speed], ['Flow direction', record.flow.direction], ['Ignition power', record.ignition.power], ['Ignition time', record.ignition.duration]].map(([name, f]) => <div key={name}><dt>{name}</dt><dd>{value(f)}</dd></div>)}
          </dl>
        </details>

        <div className="ev-actions">
          <button className="ev-ghost" onClick={() => openSource(record.id)}>Trace to source</button>
        </div>
      </aside>
    </div>
  </div>;
}
