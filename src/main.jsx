import React, {useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Compass, ExternalLink, Flame, FlaskConical, Info, Layers, Search, ShieldCheck, Sparkles, X} from 'lucide-react';
import Lab from './Lab.jsx';
import {experiments, investigations, display} from './data.js';
import {initialScenario, rank, explain} from './science.js';
import {parsePrompt, hasAnyField} from './prompt.js';
import './app.css';

const value = f => f?.status === 'ambiguous' ? `${display(f)} · verify` : display(f);
const stat = (n,label) => <div className="mini-stat"><strong>{n}</strong><span>{label}</span></div>;

function Landing({onEnter}){
  return <div className="landing">
    <div className="landing-glow"/>
    <header className="landing-top">
      <span className="brand-flame"><Flame/></span>
      <span className="landing-wordmark">fire<span className="identity-light">navigator</span></span>
      <span className="landing-team">TEAM FLAMME</span>
    </header>
    <main className="landing-hero">
      <small className="eyebrow">FLAME IN FREEFALL · NASA SPACE APPS 2026</small>
      <h1>Fire evidence,<br/><span>without the guesswork.</span></h1>
      <p>An interactive microgravity flame lab and a source-linked evidence explorer for NASA's combustion data — built by Team Flamme.</p>
      <button className="accent-btn landing-cta" onClick={onEnter}>Enter Fire Navigator <ArrowRight size={18}/></button>
      <div className="landing-cards">
        <div className="landing-card"><FlaskConical size={20}/><h3>Flame Lab</h3><p>Set real controlled parameters and watch the illustrative chamber respond live.</p></div>
        <div className="landing-card"><Compass size={20}/><h3>Evidence explorer</h3><p>Find NASA microgravity combustion records that match your scenario.</p></div>
        <div className="landing-card"><Layers size={20}/><h3>Compare</h3><p>Hold records side by side without hiding what's missing or different.</p></div>
      </div>
    </main>
    <footer className="landing-foot">No NASA endorsement · No safety certification · No validated flame prediction</footer>
  </div>;
}

function App(){
  const labRef = useRef(null);
  const [entered,setEntered] = useState(false);
  const [scenario,setScenario] = useState({...initialScenario});
  const [view,setView] = useState('Evidence');
  const [mode,setMode] = useState('Illustrative visualization');
  const [selected,setSelected] = useState('2-5');
  const [compare,setCompare] = useState(['2-5','2-2']);
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('All');
  const [drawer,setDrawer] = useState(null);
  const [reduced,setReduced] = useState(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [searched,setSearched] = useState(false);
  const [advanced,setAdvanced] = useState(false);
  const [prompt,setPrompt] = useState('');
  const [recognized,setRecognized] = useState(null);

  const ranked = useMemo(()=>rank(experiments,scenario),[scenario]);
  const results = ranked.filter(({record}) => (filter==='All'||record.investigationId===filter) && `${record.sample.material} ${record.id}`.toLowerCase().includes(query.toLowerCase()));
  const record = experiments.find(e=>e.id===selected) || experiments[0];
  const source = investigations.find(i=>i.id===record.investigationId);
  const brief = explain(record);
  const update=(key,v)=>{setScenario(s=>({...s,[key]:v}));setSearched(false)};
  const select=(label,key,items,help)=> <label className="field"><span>{label}<Info size={13} title={help}/></span><select value={scenario[key]} onChange={e=>update(key,e.target.value)}>{items.map(([v,t])=><option value={v} key={v}>{t}</option>)}</select></label>;
  const toggleCompare=id=>setCompare(c=>c.includes(id)?c.filter(x=>x!==id):c.length<3?[...c,id]:c);
  const openSource=id=>{if(id)setSelected(id);setDrawer('source')};
  const jumpToEvidence=()=>document.getElementById('evidence')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
  const askFlame=()=>{
    const parsed=parsePrompt(prompt);
    setRecognized(parsed);
    const merged={...scenario,...(parsed.material&&{material:parsed.material}),...(parsed.oxygen&&{oxygen:parsed.oxygen}),...(parsed.airflow&&{airflow:parsed.airflow}),...(parsed.direction&&{direction:parsed.direction})};
    setScenario(merged);
    setSearched(true);
    setSelected(rank(experiments,merged)[0].record.id);
    requestAnimationFrame(jumpToEvidence);
  };
  const clearRecognized=key=>{setRecognized(r=>r&&({...r,[key]:''}));update(key,'')};

  if(!entered) return <Landing onEnter={()=>setEntered(true)}/>;

  return <div className="app-shell">
    <aside className="side-nav">
      <button className="identity" onClick={()=>{setView('Evidence');window.scrollTo({top:0,behavior:'smooth'})}} aria-label="Fire Navigator home"><span className="brand-flame"><Flame/></span><span>fire<span className="identity-light">navigator</span><small>MICROGRAVITY EVIDENCE</small></span></button>
      <div className="nav-overline">WORKSPACE</div>
      {[[FlaskConical,'Lab'],[Compass,'Evidence'],[Layers,'Compare'],[BookOpen,'Sources']].map(([Icon,name])=><button key={name} className={`nav-link ${view===name?'active':''}`} onClick={()=>{
        if(name==='Sources')return setDrawer('all');
        setView(name);
      }}><Icon size={19}/>{name}{name==='Compare'&&<em>{compare.length}</em>}</button>)}
      <div className="side-foot"><span>Team Flamme · 2026</span><button onClick={()=>setDrawer('about')}><Info size={15}/> Scope & limitations</button></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><span>FIRE NAVIGATOR <b>/</b> {view==='Lab'?'Flame Lab':view==='Compare'?'Comparison':'Evidence explorer'}</span><div><span className="offline-badge">● LOCAL SOURCE EXCERPTS</span></div></header>
      <div className="workspace-inner">
        {view==='Lab'&&<>
          <section className="evidence-heading lab-heading"><div><small>02 / EXPERIMENT</small><h2>Flame Lab</h2></div><span>10 controlled parameters · illustrative chamber</span></section>
          <section className="studio-wrap" id="lab"><Lab ref={labRef} scenario={scenario} mode={mode} onMode={setMode} reduced={reduced} onReduced={setReduced}/></section>
        </>}
        {view==='Evidence'?<>
          <section className="mission" id="mission"><div className="eyebrow">EVIDENCE EXPLORER</div><h1>Fire evidence, <span>without the guesswork.</span></h1><p>Find relevant microgravity experiments, compare conditions, and trace each observation to its source.</p><div className="mission-meta">{stat(investigations.length,'investigations')}{stat(experiments.length,'curated experiment rows')}{stat('0','measured videos bundled')}</div></section>
          <section className="surface ask-panel" id="ask"><div className="section-top"><small>00 / ASK</small><h2><Sparkles size={18}/> Ask Flame</h2><p>Describe a scenario in plain language. Flame parses it into the controlled conditions below — nothing is ever silently assumed.</p></div>
            <div className="ask-row">
              <input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')askFlame()}} placeholder="e.g. cotton-fiberglass at 22% oxygen with 20 cm/s opposed airflow" aria-label="Ask Flame a question"/>
              <button className="accent-btn" onClick={askFlame}><Search size={16}/> Ask Flame</button>
            </div>
            {recognized&&<div className="ask-chips">
              <span>Flame read:</span>
              {recognized.material&&<em className="chip">material: {recognized.material}<button aria-label="Clear material" onClick={()=>clearRecognized('material')}><X size={11}/></button></em>}
              {recognized.oxygen&&<em className="chip">oxygen ≈ {recognized.oxygen}%<button aria-label="Clear oxygen" onClick={()=>clearRecognized('oxygen')}><X size={11}/></button></em>}
              {recognized.airflow&&<em className="chip">airflow ≈ {recognized.airflow} cm/s<button aria-label="Clear airflow" onClick={()=>clearRecognized('airflow')}><X size={11}/></button></em>}
              {recognized.direction&&<em className="chip">flow: {recognized.direction}<button aria-label="Clear direction" onClick={()=>clearRecognized('direction')}><X size={11}/></button></em>}
              {!hasAnyField(recognized)&&<em className="chip unmatched">No recognized conditions in that question — showing the current scenario below.</em>}
              <span className="ask-note"><ShieldCheck size={12}/> Deterministic keyword parsing, not an AI model. Edit any value below.</span>
            </div>}
          </section>
          <section id="evidence" className="evidence-block"><div className="evidence-heading"><div><small>03 / INVESTIGATE</small><h2>Follow the evidence</h2></div><span>{results.length} records · transparent condition matching</span></div><div className="evidence-grid"><section className="surface scenario-panel" id="scenario"><div className="section-top"><small>01 / DEFINE</small><h2>Set the question</h2><p>Only controls that affect evidence ranking appear here.</p></div>
              {select('Material','material',[['Cotton–fiberglass (SIBAL)','Cotton–fiberglass (SIBAL)'],['Silicone','Silicone'],['PMMA','PMMA'],['','Any material']],'Source-reported sample material.')}
              <div className="field-pair">{select('Oxygen · vol %','oxygen',[['22.1','22.1'],['21.5','21.5'],['22.2','22.2'],['','Any']],'Matched within ±0.5 percentage points; approximate source values stay approximate.')}{select('Flow · cm/s','airflow',[['20','20'],['10','10'],['5','5'],['','Any']],'Matched within ±2 cm/s. BASS instrument readings are not airflow speeds.')}</div>
              <div className="field readonly"><span>Pressure · kPa</span><div className="unknown-val">Unknown — not reported in source</div></div>
              <button className="disclosure" onClick={()=>setAdvanced(!advanced)} aria-expanded={advanced}>Additional matching conditions <ChevronDown size={16}/></button>
              {advanced&&<div className="advanced-content"><p className="availability-note">All bundled records are microgravity tests. Pressure is unreported and cannot be used for matching yet.</p>{select('Flow direction','direction',[['','Any'],['Concurrent','Concurrent'],['Opposed','Opposed']],'Exact match against the reported flow direction.')}{select('Sample width · cm','geometry',[['','Unspecified'],['5','5'],['2','2']],'Exact-width matching only.')}{select('Outcome availability','outcome',[['spread','Reported spread-column entry'],['burn','Reported burn-time entry'],['burnLength','Reported burn length'],['smoke','Smoke / particles'],['heat','Heat release']],'Availability filter, not a prediction of the outcome.')}</div>}
              <button className="accent-btn search-action" onClick={()=>{setSearched(true);setSelected(rank(experiments,scenario)[0].record.id);document.getElementById('evidence')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'})}}>Find relevant evidence <ArrowRight size={18}/></button>
              <p className="safety-note"><ShieldCheck size={15}/> Missing inputs never become assumed measurements.</p>
            </section><section className="surface result-panel"><div className="result-tools"><label><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search material or sample ID" aria-label="Search evidence"/></label><select aria-label="Filter investigation" value={filter} onChange={e=>setFilter(e.target.value)}><option value="All">All investigations</option>{investigations.map(i=><option value={i.id} key={i.id}>{i.name}</option>)}</select></div><div className="result-caption">{searched?'QUERY RESULTS':'CLOSEST BUNDLED RECORDS'}</div>{results.length===0?<div className="empty-result">No matching records. Remove a search filter or choose another scenario.</div>:results.map(({record:r,matched,evaluated,reasons,exact},idx)=><article className={`result ${selected===r.id?'selected':''}`} key={r.id}><button className="result-select" onClick={()=>setSelected(r.id)}><span className="result-kicker">{r.investigationId==='PSI-99'?'SAFFIRE II':'BASS II'} / {r.id}<em>{matched} matched · {8-evaluated} unknown</em></span><strong>{r.sample.material}</strong><span className="result-conditions">{value(r.environment.oxygen)} O₂ · {value(r.flow.speed)} flow</span><span className="match-reasons">{reasons.filter(x=>x.state!=='unknown').slice(0,3).map(x=><span className={x.state} key={x.label}>{x.text}</span>)}</span><span className="result-class">{exact?'All indexed conditions match':'Partial analogue — inspect differences'}</span></button><button className={`compare-add ${compare.includes(r.id)?'on':''}`} aria-label={`${compare.includes(r.id)?'Remove':'Add'} ${r.id} ${compare.includes(r.id)?'from':'to'} comparison`} onClick={()=>toggleCompare(r.id)}>{compare.includes(r.id)?<Check size={17}/>:<Layers size={17}/>}</button></article>)}</section>
            <section className="surface evidence-card"><div className="card-top"><div><small>EXPERIMENT {record.id} / {source.name}</small><h2>{record.sample.material}</h2></div><span className="source-pill">SOURCE RECORD</span></div><p className="record-context">{source.platform} · Source table row {record.source.row}</p><div className="evidence-segment observed"><span>OBSERVED</span><p>{brief.observed}</p>{record.investigationId==='PSI-99'&&<div className="measurement-row"><div><strong>{value(record.measurements.burn)}</strong><small>{record.measurements.burn.status==='qualitative'?'SOURCE BURN-TIME ENTRY':'REPORTED BURN TIME'}</small></div><div><strong>{value(record.measurements.spread)}</strong><small>SOURCE SPREAD-COLUMN ENTRY*</small></div></div>}</div><div className="evidence-segment"><span>INTERPRETATION · RULE-BASED</span><p>{brief.interpretation}</p></div><div className="evidence-segment limitation"><span>UNKNOWN / LIMITATIONS</span><p>{brief.limitations}</p></div><details className="raw-details"><summary>See original conditions <ChevronDown size={15}/></summary>{[['Thickness',record.sample.thickness],['Length',record.sample.length],['Width',record.sample.width],['Oxygen',record.environment.oxygen],['Pressure',record.environment.pressure],['Airflow',record.flow.speed],['Flow direction',record.flow.direction],['Ignition power',record.ignition.power],['Ignition time',record.ignition.duration]].map(([name,f])=><div key={name}><span>{name}</span><strong>{value(f)}</strong></div>)}</details><div className="card-actions"><button className="outline-btn" onClick={()=>openSource(record.id)}>Trace to NASA source <ArrowUpRight size={15}/></button><button className="quiet-btn" onClick={()=>{if(!compare.includes(record.id))toggleCompare(record.id);setView('Compare')}}>Compare record <ArrowRight size={15}/></button></div></section></div></section>
        </>:view==='Compare'?<section className="comparison-page" id="comparison"><div className="comparison-intro"><small>04 / COMPARE</small><h1>Compare observations.<br/><span>Keep the differences visible.</span></h1><p>These records are analogues, not a controlled material ranking. Their outcomes should not be attributed to a single changed variable.</p></div><div className="compare-warning"><Info size={18}/><span>Material, thickness and unreported conditions can confound comparisons. An unknown value is never treated as equal.</span></div>{compare.length<2?<div className="empty-result">Choose at least two records in Evidence to compare them.</div>:<div className="compare-cards">{compare.map(id=>{const r=experiments.find(x=>x.id===id);if(!r)return null;return <article className="surface compare-card" key={id}><small>{r.investigationId} / {r.id}</small><h2>{r.sample.material}</h2>{[['Gravity',r.environment.gravity],['Oxygen',r.environment.oxygen],['Airflow',r.flow.speed],['Flow direction',r.flow.direction],['Pressure',r.environment.pressure],['Thickness',r.sample.thickness],['Sample length',r.sample.length],['Width',r.sample.width],['Ignition power',r.ignition.power],['Ignition time',r.ignition.duration],['Burn-time entry',r.measurements.burn],['Spread-column entry*',r.measurements.spread]].map(([name,f])=><div className="compare-line" key={name}><span>{name}</span><b>{value(f)}</b></div>)}<button className="outline-btn" onClick={()=>openSource(id)}>Source row {r.source.row} <ExternalLink size={14}/></button></article>})}</div>}<p className="compare-footnote">* The Saffire II CSV calls this column “µ-g Spread Length,” but sample 2-5 contains a value in mm/s. We preserve the source entry and flag the label conflict.</p></section>:null}
        <footer className="page-foot">NASA PSI source excerpts · Fire Navigator by Team Flamme <span>No NASA endorsement · No safety certification · No validated flame prediction</span></footer>
      </div>
    </main>
    {drawer&&<div className="modal-backdrop" onClick={()=>setDrawer(null)}><aside className="source-drawer" role="dialog" aria-modal="true" aria-label={drawer==='about'?'Scope and limitations':'Source information'} onClick={e=>e.stopPropagation()}><button className="drawer-close" aria-label="Close" onClick={()=>setDrawer(null)}><X/></button>{drawer==='about'?<><small>ABOUT THE PROTOTYPE</small><h2>Evidence discovery, not certification.</h2><p>Five real source-table rows are bundled. The interface ranks physical-condition similarity and generates a deterministic explanation. It does not call an AI model, simulate combustion physics, or contain measured video.</p><p>Not a safety certification — this does not identify the safest material or predict a real fire.</p><p>The 3D chamber is an interactive schematic. Changes to its appearance illustrate selected inputs; they do not predict a fire outcome.</p><p>NASA PSI investigation pages and DOIs require internet. Local data excerpts remain available offline.</p></>:drawer==='all'?<><small>DATA SOURCES</small><h2>Curated NASA PSI investigations</h2>{investigations.map(i=><div className="drawer-source" key={i.id}><strong>{i.name}</strong><p>{i.title} · {i.platform}</p><a href={i.url} target="_blank" rel="noreferrer">Open {i.id} <ExternalLink size={14}/></a><a href={`https://doi.org/${i.doi}`} target="_blank" rel="noreferrer">DOI {i.doi} <ExternalLink size={14}/></a></div>)}</>:<><small>DATA LINEAGE</small><h2>{source.name} · sample {record.id}</h2><p>{source.title} on {source.platform}. The displayed values come from local CSV <strong>{record.source.file}</strong>, <mark className="trace">row {record.source.row}</mark> (header is row 1).</p><div className="lineage-box">Source table → experiment {record.id} → observed card → cautious interpretation</div><p>{record.source.notes}</p><a href={source.url} target="_blank" rel="noreferrer">Open NASA PSI investigation <ExternalLink size={15}/></a><a href={`https://doi.org/${source.doi}`} target="_blank" rel="noreferrer">DOI {source.doi} <ExternalLink size={15}/></a></>}</aside></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
