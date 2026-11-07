import React from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, ArrowUpRight, Check, ChevronDown, Info, Layers, Search, ShieldCheck} from 'lucide-react';
import {useFlamme, value} from '../context/FlammeContext.jsx';

/* Real route: /evidence. */
export default function EvidencePage() {
  const {
    scenario, update, results, selected, setSelected, compare, toggleCompare,
    query, setQuery, filter, setFilter, investigations, record, source, brief,
    setSearched, advanced, setAdvanced, ranked, openSource,
  } = useFlamme();
  const navigate = useNavigate();

  const select = (label, key, items, help) => <label className="field"><span>{label}<Info size={13} title={help}/></span>
    <select value={scenario[key]} onChange={e => update(key, e.target.value)}>{items.map(([v, t]) => <option value={v} key={v}>{t}</option>)}</select>
  </label>;

  return <div className="reveal">
    <section className="mission" id="mission"><h1>Fire evidence, <span>without the guesswork.</span></h1></section>
    <section id="evidence" className="evidence-block">
      <div className="evidence-heading"><h2>Follow the evidence</h2><span>{results.length} records</span></div>
      <div className="filter-bar" id="scenario">
        {select('Material', 'material', [['Cotton–fiberglass (SIBAL)', 'Cotton–fiberglass (SIBAL)'], ['Silicone', 'Silicone'], ['PMMA', 'PMMA'], ['', 'Any material']], 'Source-reported sample material.')}
        {select('Oxygen · vol %', 'oxygen', [['22.1', '22.1'], ['21.5', '21.5'], ['22.2', '22.2'], ['', 'Any']], 'Matched within ±0.5 percentage points.')}
        {select('Flow · cm/s', 'airflow', [['20', '20'], ['10', '10'], ['5', '5'], ['', 'Any']], 'Matched within ±2 cm/s.')}
        <button className="disclosure" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>More filters <ChevronDown size={16}/></button>
        <button className="accent-btn search-action" onClick={() => { setSearched(true); setSelected(ranked[0].record.id); document.getElementById('evidence')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }}>Find relevant evidence <ArrowRight size={18}/></button>
      </div>
      {advanced && <div className="advanced-row">
        {select('Flow direction', 'direction', [['', 'Any'], ['Concurrent', 'Concurrent'], ['Opposed', 'Opposed']], 'Exact match against the reported flow direction.')}
        {select('Sample width · cm', 'geometry', [['', 'Unspecified'], ['5', '5'], ['2', '2']], 'Exact-width matching only.')}
        {select('Outcome availability', 'outcome', [['spread', 'Reported spread-column entry'], ['burn', 'Reported burn-time entry'], ['burnLength', 'Reported burn length'], ['smoke', 'Smoke / particles'], ['heat', 'Heat release']], 'Availability filter, not a prediction of the outcome.')}
        <span className="safety-note"><ShieldCheck size={13}/> Pressure is unreported — missing inputs are never assumed.</span>
      </div>}
      <div className="evidence-split">
        <section className="surface result-panel">
          <div className="result-tools">
            <label><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search material or sample ID" aria-label="Search evidence"/></label>
            <select aria-label="Filter investigation" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="All">All investigations</option>
              {investigations.map(i => <option value={i.id} key={i.id}>{i.name}</option>)}
            </select>
          </div>
          {results.length === 0 ? <div className="empty-result">No matching records.</div> : results.map(({record: r, matched, reasons}) =>
            <article className={`result ${selected === r.id ? 'selected' : ''}`} key={r.id}>
              <button className="result-select" onClick={() => setSelected(r.id)}>
                <span className="result-kicker">{r.investigationId === 'PSI-99' ? 'SAFFIRE II' : 'BASS II'} / {r.id}<em>{matched} matched</em></span>
                <strong>{r.sample.material}</strong>
                <span className="result-conditions">{value(r.environment.oxygen)} O₂ · {value(r.flow.speed)} flow</span>
                <span className="match-reasons">{reasons.filter(x => x.state !== 'unknown').slice(0, 3).map(x => <span className={x.state} key={x.label}>{x.text}</span>)}</span>
              </button>
              <button className={`compare-add ${compare.includes(r.id) ? 'on' : ''}`} aria-label={`${compare.includes(r.id) ? 'Remove' : 'Add'} ${r.id} ${compare.includes(r.id) ? 'from' : 'to'} comparison`} onClick={() => toggleCompare(r.id)}>
                {compare.includes(r.id) ? <Check size={17}/> : <Layers size={17}/>}
              </button>
            </article>
          )}
        </section>
        <section className="surface evidence-card">
          <div className="card-top"><div><small>EXPERIMENT {record.id} / {source.name}</small><h2>{record.sample.material}</h2></div><span className="source-pill">SOURCE RECORD</span></div>
          <p className="record-context">{source.platform} · row {record.source.row}</p>
          <div className="evidence-segment observed">
            <span>OBSERVED</span><p>{brief.observed}</p>
            {record.investigationId === 'PSI-99' && <div className="measurement-row">
              <div><strong>{value(record.measurements.burn)}</strong><small>{record.measurements.burn.status === 'qualitative' ? 'SOURCE BURN-TIME ENTRY' : 'REPORTED BURN TIME'}</small></div>
              <div><strong>{value(record.measurements.spread)}</strong><small>SOURCE SPREAD-COLUMN ENTRY*</small></div>
            </div>}
          </div>
          <div className="evidence-segment"><span>INTERPRETATION · RULE-BASED</span><p>{brief.interpretation}</p></div>
          <div className="evidence-segment limitation"><span>UNKNOWN / LIMITATIONS</span><p>{brief.limitations}</p></div>
          <details className="raw-details">
            <summary>See original conditions <ChevronDown size={15}/></summary>
            {[['Thickness', record.sample.thickness], ['Length', record.sample.length], ['Width', record.sample.width], ['Oxygen', record.environment.oxygen], ['Pressure', record.environment.pressure], ['Airflow', record.flow.speed], ['Flow direction', record.flow.direction], ['Ignition power', record.ignition.power], ['Ignition time', record.ignition.duration]].map(([name, f]) => <div key={name}><span>{name}</span><strong>{value(f)}</strong></div>)}
          </details>
          <div className="card-actions">
            <button className="outline-btn" onClick={() => openSource(record.id)}>Trace to NASA source <ArrowUpRight size={15}/></button>
            <button className="quiet-btn" onClick={() => { if (!compare.includes(record.id)) toggleCompare(record.id); navigate('/compare'); }}>Compare record <ArrowRight size={15}/></button>
          </div>
        </section>
      </div>
    </section>
  </div>;
}
