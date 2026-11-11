import React from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, Check, ChevronDown, Layers, Search, ShieldCheck} from 'lucide-react';
import {useFlamme, value} from '../context/FlammeContext.jsx';

/* Real route: /evidence. Two separate jobs, kept visually apart:
   - the row you click OPENS a record in the detail panel, and
   - the "Compare" tick ADDS it to the Compare page (up to three). */
export default function EvidencePage() {
  const {
    scenario, update, results, selected, setSelected, compare, toggleCompare,
    query, setQuery, filter, setFilter, investigations, record, source, brief,
    setSearched, advanced, setAdvanced, ranked, openSource,
  } = useFlamme();
  const navigate = useNavigate();

  const select = (label, key, items) => <label className="ev-field">
    <span>{label}</span>
    <select value={scenario[key]} onChange={e => update(key, e.target.value)}>{items.map(([v, t]) => <option value={v} key={v}>{t}</option>)}</select>
  </label>;

  const inCompare = compare.includes(record.id);
  const full = compare.length >= 3;

  return <div className="ev reveal">
    <header className="ev-head">
      <div>
        <span className="ev-kicker">Evidence</span>
        <h1>Find the record that fits</h1>
        <p>Set a scenario, open a record to read it, and tick up to three to compare.</p>
      </div>
      <button className="ev-primary" onClick={() => { setSearched(true); setSelected(ranked[0].record.id); document.getElementById('ev-list')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }}>
        Best match <ArrowRight size={16}/>
      </button>
    </header>

    <div className="ev-filters" id="scenario">
      {select('Material', 'material', [['Cotton–fiberglass (SIBAL)', 'Cotton–fiberglass (SIBAL)'], ['Silicone', 'Silicone'], ['PMMA', 'PMMA'], ['', 'Any']])}
      {select('Oxygen', 'oxygen', [['22.1', '22.1 %'], ['21.5', '21.5 %'], ['22.2', '22.2 %'], ['', 'Any']])}
      {select('Airflow', 'airflow', [['20', '20 cm/s'], ['10', '10 cm/s'], ['5', '5 cm/s'], ['', 'Any']])}
      <button className="ev-more" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>More <ChevronDown size={14} className={advanced ? 'up' : ''}/></button>
    </div>
    {advanced && <div className="ev-filters ev-advanced">
      {select('Flow direction', 'direction', [['', 'Any'], ['Concurrent', 'Concurrent'], ['Opposed', 'Opposed']])}
      {select('Sample width', 'geometry', [['', 'Unspecified'], ['5', '5 cm'], ['2', '2 cm']])}
      {select('Outcome', 'outcome', [['spread', 'Spread-column entry'], ['burn', 'Burn-time entry'], ['burnLength', 'Burn length'], ['smoke', 'Smoke / particles'], ['heat', 'Heat release']])}
      <p className="ev-note"><ShieldCheck size={13}/> Missing inputs are never assumed.</p>
    </div>}

    <div className="ev-split">
      <section className="ev-list" id="ev-list" aria-label="Matching records">
        <div className="ev-list-top">
          <label className="ev-search"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search material or ID" aria-label="Search evidence"/></label>
          <select aria-label="Investigation" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="All">All sources</option>
            {investigations.map(i => <option value={i.id} key={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="ev-count">{results.length} record{results.length === 1 ? '' : 's'}{compare.length > 0 && <> · <b>{compare.length}</b> to compare</>}</div>

        {results.length === 0 ? <div className="ev-empty">No records match this scenario.</div> : results.map(({record: r, matched}) => {
          const isOpen = selected === r.id;
          const isIn = compare.includes(r.id);
          return <div key={r.id} className={`ev-row ${isOpen ? 'open' : ''}`}>
            <button className="ev-row-main" onClick={() => setSelected(r.id)} aria-pressed={isOpen}>
              <span className="ev-row-id">{r.id}</span>
              <span className="ev-row-body">
                <strong>{r.sample.material}</strong>
                <small>{r.investigationId === 'PSI-99' ? 'Saffire II' : 'BASS II'} · {value(r.environment.oxygen)} O₂ · {value(r.flow.speed)}</small>
              </span>
              <span className="ev-row-match">{matched} match</span>
            </button>
            <button className={`ev-tick ${isIn ? 'on' : ''}`} disabled={!isIn && full}
              aria-pressed={isIn}
              title={isIn ? 'Remove from comparison' : full ? 'Compare holds up to three records' : 'Add to comparison'}
              onClick={() => toggleCompare(r.id)}>
              {isIn ? <Check size={14}/> : <Layers size={14}/>}
              <span>{isIn ? 'Comparing' : 'Compare'}</span>
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
          <button className="ev-primary" disabled={!inCompare && full}
            onClick={() => { if (!inCompare) toggleCompare(record.id); navigate('/compare'); }}>
            {inCompare ? 'View comparison' : 'Compare this'} <ArrowRight size={16}/>
          </button>
        </div>
      </aside>
    </div>
  </div>;
}
