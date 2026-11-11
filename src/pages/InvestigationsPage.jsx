import React, {useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, ExternalLink, Layers, X} from 'lucide-react';
import invs from '../investigationsData.json';
import {findings, rankFindings, scenarios} from '../ranking.js';
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

export default function InvestigationsPage() {
  const [scn, setScn] = useState('moon');
  const [pillar, setPillar] = useState('All');
  const [hw, setHw] = useState('All');
  const [fuel, setFuel] = useState('All');
  const [sel, setSel] = useState(['PSI-69', 'PSI-25']);
  const [open, setOpen] = useState(false);
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
    ['Active', i => i.start || i.end ? `${i.start || '?'}–${i.end || '?'}` : 'not stated'],
    ['Test-matrix rows', i => i.test_rows || 'none in tables'], ['O₂ tested (linked findings)', o2],
    ['Linked findings', i => i.n], [`Best score · ${scenarios[scn].label}`, i => i.best ?? '—'],
    ['Objective', i => i.objective], ['Keywords', i => i.keywords],
  ];
  const Seg = ({label, val, set, opts}) => <div className="iv-seg"><small>{label}</small><div>{opts.map(o => <button key={o} className={val === o ? 'on' : ''} onClick={() => set(o)}>{o}</button>)}</div></div>;

  return <div className="iv reveal">
    <header>
      <span className="cmp-kicker">Investigations</span>
      <h1>Compare the 24 NASA combustion investigations</h1>
      <p className="rk-lede">Find which investigations speak to the crew environment you care about, then compare their fuels, hardware, and conditions side by side. Select up to {MAX}.</p>
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
          <button className="iv-pick" aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${i.name} ${on ? 'from' : 'to'} comparison`} disabled={!on && sel.length >= MAX} onClick={() => toggle(i.id)}>{on && <Check size={14}/>}</button>
          <div className="iv-main"><b>{i.name}</b> <span className="iv-id">{i.id}</span>
            <small>{i.hardware} · {i.fuel} · {i.pillars.join(' / ') || 'Fundamental'}</small></div>
          <div className="iv-score" title={i.n ? `${i.n} linked findings` : 'No linked findings'}>{i.best != null ? i.best.toFixed(1) : '—'}<small>{i.n} findings</small></div>
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
