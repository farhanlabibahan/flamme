import React, {useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, ChevronDown, ExternalLink, Layers, X} from 'lucide-react';
import invs from '../investigationsData.json';
import {findings, rankFindings, scenarios} from '../ranking.js';
import {BACKGROUND} from '../missionContext.js';
import guide from '../guideFacts.json';
import variation from '../variationData.json';
import './InvestigationsPage.css';

/* Real route: /investigations. Browse all 24 PSI combustion investigations,
   filter by safety pillar / hardware / fuel phase, rank them for a crew
   environment (best linked finding score from /rankings), and compare up to 4
   side by side. Pillar, hardware and fuel groupings are curated from the
   challenge brief; dates, objectives, DOIs and test-row counts come from PSI. */
const MAX = 4;
const uniq = k => ['All', ...new Set(invs.map(i => i[k]))];
const PILLARS = ['All', 'Prevention', 'Detection', 'Suppression'];
const byId = Object.fromEntries(findings.map(f => [f.finding_id, f]));

/* "What varied, what stayed the same" for one investigation, computed from its PSI test-matrix rows
   (findings/build_variation.py -> src/variationData.json). */
function Variation({id}) {
  const v = variation[id];
  if (!v) return <p className="iv-var-none">PSI has no test-matrix table for this investigation, so its conditions can’t be compared test by test. See the objective in the comparison view.</p>;
  return <div className="iv-var">
    <p className="iv-var-n">Across <b>{v.rows}</b> {v.rows === 1 ? 'row' : 'rows'} in its PSI table(s):</p>
    <div className="iv-var-cols">
      <div><h4>Varied between tests</h4>
        {v.varied.length ? <dl>{v.varied.map(x => <React.Fragment key={x.label}><dt>{x.label}</dt><dd>{x.value}</dd></React.Fragment>)}</dl> : <p className="iv-var-none">Nothing in the table’s condition columns varied.</p>}</div>
      <div><h4>Held the same</h4>
        {v.constant.length ? <dl>{v.constant.map(x => <React.Fragment key={x.label}><dt>{x.label}</dt><dd>{x.value}</dd></React.Fragment>)}</dl> : <p className="iv-var-none">No condition column stayed fixed.</p>}</div>
    </div>
    {v.recorded.length > 0 && <p className="iv-var-rec"><b>Also recorded:</b> {v.recorded.join(' · ')}</p>}
    {v.notes.map(n => <p key={n} className="iv-var-note">{n}</p>)}
  </div>;
}

export default function InvestigationsPage() {
  const [scn, setScn] = useState('moon');
  const [pillar, setPillar] = useState('All');
  const [hw, setHw] = useState('All');
  const [fuel, setFuel] = useState('All');
  const [sel, setSel] = useState(['PSI-69', 'PSI-25']);
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState([]);
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const ranked = useMemo(() => {
    const score = Object.fromEntries(rankFindings(scenarios[scn]).map(r => [r.f.finding_id, r.score]));
    return invs.map(i => {
      const sc = i.finding_ids.map(id => score[id]).filter(x => x != null);
      return {...i, best: sc.length ? Math.max(...sc) : null, n: sc.length};
    }).sort((a, b) => (b.best ?? -1) - (a.best ?? -1));
  }, [scn]);
  const shown = ranked.filter(i => (pillar === 'All' || i.pillars.includes(pillar)) && (hw === 'All' || i.hardware === hw) && (fuel === 'All' || i.fuel === fuel));
  const chosen = sel.map(id => ranked.find(i => i.id === id)).filter(Boolean);
  const toggle = id => setSel(s => {
    const next = s.includes(id) ? s.filter(x => x !== id) : s.length >= MAX ? s : [...s, id];
    if (next.length === 0) setOpen(false);
    return next;
  });
  const o2 = i => {
    const v = i.finding_ids.map(id => byId[id]).flatMap(f => [f.o2_pct_min, f.o2_pct_max]).filter(x => x != null);
    return v.length ? `${Math.min(...v)}–${Math.max(...v)}%` : 'not in findings';
  };
  const ROWS = [
    ['Hardware', i => i.hardware], ['Platform', i => i.platform], ['Fuel phase', i => i.fuel],
    ['Safety pillars', i => i.pillars.join(', ') || 'Fundamental science'],
    ['PSI listed dates', i => i.start || i.end ? `${i.start || '?'}–${i.end || '?'}` : 'not stated'],
    ['Test-matrix rows', i => i.test_rows || 'none in tables'], ['O₂ tested (linked findings)', o2],
    ['Varied between tests', i => variation[i.id]?.varied.map(x => x.label).join(', ') || (variation[i.id] ? 'nothing in the table' : 'no test table')],
    ['Held the same', i => variation[i.id]?.constant.map(x => `${x.label}: ${x.value}`).join(' · ') || (variation[i.id] ? 'none' : 'no test table')],
    ['Linked findings', i => i.n], [`Best score · ${scenarios[scn].label}`, i => i.best ?? '—'],
    ['Objective (PSI)', i => i.objective],
    ['Researcher’s Guide (2015)', i => guide[i.id] ? `${guide[i.id].objective} · ${guide[i.id].hardware} · ${guide[i.id].dates}` : 'not covered by the guide'], ['Keywords', i => i.keywords],
  ];
  const Seg = ({label, val, set, opts}) => <div className="iv-seg"><small>{label}</small><div>{opts.map(o => <button key={o} className={val === o ? 'on' : ''} onClick={() => set(o)}>{o}</button>)}</div></div>;

  return <div className="iv reveal">
    <header>
      <span className="cmp-kicker">Investigations</span>
      <h1>Compare the 24 NASA combustion investigations</h1>
      <p className="iv-bg">Background reading: <a href={BACKGROUND.combustion} target="_blank" rel="noreferrer">NASA Combustion Science <ExternalLink size={11}/></a> · <a href={BACKGROUND.guide} target="_blank" rel="noreferrer">Researcher’s Guide to ISS Combustion Science <ExternalLink size={11}/></a> · <a href={BACKGROUND.video} target="_blank" rel="noreferrer">ScienceCast video <ExternalLink size={11}/></a></p>
    </header>
    <section className="surface iv-filters">
      <div className="iv-seg"><small>Rank for</small><div>{Object.entries(scenarios).map(([k, s]) => <button key={k} className={scn === k ? 'on' : ''} onClick={() => setScn(k)}>{s.label.split(' (')[0]}</button>)}</div></div>
      <Seg label="Safety pillar" val={pillar} set={setPillar} opts={PILLARS}/>
      <Seg label="Hardware" val={hw} set={setHw} opts={uniq('hardware')}/>
      <Seg label="Fuel phase" val={fuel} set={setFuel} opts={uniq('fuel')}/>
    </section>

    <ul className="iv-list">
      {shown.map(i => {
        const on = sel.includes(i.id);
        return <li key={i.id} className={`surface iv-item ${on ? 'on' : ''}`}>
          <button className="iv-pick" aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${i.name} ${on ? 'from' : 'to'} comparison`} disabled={!on && sel.length >= MAX} title={!on && sel.length >= MAX ? `Limit of ${MAX} reached. Remove one to add another.` : undefined} onClick={() => toggle(i.id)}>{on && <Check size={14}/>}</button>
          <div className="iv-main"><b>{i.name}</b> <span className="iv-id">{i.id}</span>
            <small>{i.hardware} · {i.fuel} · {i.pillars.join(' / ') || 'Fundamental'}</small>
            <button className="iv-var-btn" aria-expanded={exp.includes(i.id)} onClick={() => setExp(e => e.includes(i.id) ? e.filter(x => x !== i.id) : [...e, i.id])}>What varied between tests <ChevronDown size={13} className={exp.includes(i.id) ? 'up' : ''}/></button></div>
          <div className="iv-score" title={i.n ? `${i.n} linked findings` : 'No linked findings'}>{i.best != null ? i.best.toFixed(1) : '—'}<small>{i.n} {i.n === 1 ? 'finding' : 'findings'}</small></div>
          {exp.includes(i.id) && <div className="iv-detail"><Variation id={i.id}/></div>}
        </li>;
      })}
      {!shown.length && <li className="rk-empty">No investigations match these filters.</li>}
    </ul>

    {chosen.length > 0 && createPortal(<button className={`iv-float-compare ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={open ? 'Hide comparison' : 'Show comparison'}>
      <Layers size={17}/> Compare <em>{chosen.length}</em>
    </button>, document.body)}

    {open && chosen.length > 0 && createPortal(<div className="iv-backdrop" onClick={() => setOpen(false)}/>, document.body)}
    {open && chosen.length > 0 && createPortal(<section className="surface iv-compare iv-compare-float" role="dialog" aria-modal="true" aria-label="Comparison">
      <div className="iv-compare-head">
        <h2>Side-by-side</h2>
        <button className="iv-compare-close" aria-label="Close comparison" onClick={() => setOpen(false)}><X size={16}/></button>
      </div>
      <div className="iv-scroll"><table>
        <thead><tr><th/>{chosen.map(i => <th key={i.id}><b>{i.name}</b><button aria-label={`Remove ${i.name}`} onClick={() => toggle(i.id)}><X size={13}/></button><br/>
          <a href={i.url} target="_blank" rel="noreferrer">{i.id} <ExternalLink size={11}/></a></th>)}</tr></thead>
        <tbody>{ROWS.map(([l, fn]) => {
          const vals = chosen.map(fn), diff = new Set(vals.map(String)).size > 1;
          return <tr key={l} className={diff ? 'diff' : ''}><th scope="row">{l}</th>{vals.map((v, k) => <td key={k}>{v}</td>)}</tr>;
        })}</tbody>
      </table></div>
    </section>, document.body)}
  </div>;
}
