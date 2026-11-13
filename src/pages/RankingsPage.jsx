import React, {useMemo, useState} from 'react';
import {AlertTriangle, ChevronDown, ExternalLink} from 'lucide-react';
import {CONTROL_PATTERNS, DEFAULT_WEIGHTS, controlTags, exportRows, findings, gapsFor, rankFindings, scenarios, toCsv} from '../ranking.js';
import './RankingsPage.css';

/* Real route: /rankings. Scores every finding in the full catalog (115 rows
   from 24 PSI investigations + NTRS reports, incl. Apollo 1 / Apollo 13 / Mir
   real-incident lessons) for a chosen crew environment.
   Same formula as findings/rank_findings.py; edit O2 / pressure / gravity or
   the weights and the ranking recomputes live. */
const PRESETS = {...scenarios, custom: {label: 'Custom', o2_pct: 30, pressure_atm: 0.69, gravity_g: 0}};
const THEMES = ['All', ...[...new Set(findings.map(f => f.theme))].sort()];
const CONTROLS = ['All', ...Object.keys(CONTROL_PATTERNS)];
const SEV_LABEL = {3: 'Direct threat', 2: 'Design info', 1: 'Background'};
const urlOf = s => (s.match(/https?:\/\/\S+/) || [])[0];

function Bar({v}) { return <span className="rk-bar" title={v.toFixed(2)}><i style={{width: `${Math.round(v * 100)}%`}}/></span>; }

export default function RankingsPage() {
  const [key, setKey] = useState('moon');
  const [custom, setCustom] = useState(PRESETS.custom);
  const [w, setW] = useState(DEFAULT_WEIGHTS);
  const [theme, setTheme] = useState('All');
  const [control, setControl] = useState('All');
  const [open, setOpen] = useState(null);
  const sc = key === 'custom' ? custom : PRESETS[key];
  const ranked = useMemo(() => rankFindings(sc, w), [sc, w]);
  const shown = ranked.map((r, i) => ({...r, rank: i + 1})).filter(r => (theme === 'All' || r.f.theme === theme) && (control === 'All' || controlTags(r.f).includes(control)));
  const gaps = gapsFor(sc);
  const download = fmt => {
    const rows = exportRows(shown.map(r => ({...r, score: r.score})));
    const body = fmt === 'csv' ? toCsv(rows) : JSON.stringify({scenario: sc, weights: w, theme, control, findings: rows}, null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], {type: fmt === 'csv' ? 'text/csv' : 'application/json'}));
    a.download = `flamme-findings-${key}.${fmt}`; a.click(); URL.revokeObjectURL(a.href);
  };
  const n0 = findings.filter(f => /microgravity/i.test(f.gravity)).length, n1 = findings.filter(f => /1-?g/i.test(f.gravity)).length;
  const setC = (k, v) => { setCustom(c => ({...c, [k]: Number(v)})); setKey('custom'); };

  return <div className="rk reveal">
    <header className="rk-top">
      <h1>What matters most for this crew environment?</h1>
      <span className="rk-count"><b>{shown.length}</b> of {ranked.length} findings</span>
    </header>

    <section className="rk-controls">
      <label className="rk-field rk-scenario">
        <span>Crew environment</span>
        <select value={key} onChange={e => setKey(e.target.value)}>
          {Object.entries(PRESETS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
      </label>

      <div className="rk-sliders">
        <label className="rk-field"><span>Oxygen <em>{sc.o2_pct}%</em></span>
          <input type="range" min="15" max="85" value={sc.o2_pct} onChange={e => setC('o2_pct', e.target.value)}/></label>
        <label className="rk-field"><span>Pressure <em>{sc.pressure_atm} atm</em></span>
          <input type="range" min="0.2" max="1.1" step="0.01" value={sc.pressure_atm} onChange={e => setC('pressure_atm', e.target.value)}/></label>
        <label className="rk-field"><span>Gravity <em>{sc.gravity_g} g</em></span>
          <input type="range" min="0" max="1" step="0.01" value={sc.gravity_g} onChange={e => setC('gravity_g', e.target.value)}/></label>
      </div>

      <div className="rk-toolbar">
        <label className="rk-field rk-theme">
          <span>Theme</span>
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="rk-field rk-theme">
          <span>Controls &amp; equipment</span>
          <select value={control} onChange={e => setControl(e.target.value)}>
            {CONTROLS.map(t => <option key={t} value={t}>{t === 'All' ? 'All findings' : t}</option>)}
          </select>
        </label>
        <div className="rk-export">
          <button onClick={() => download('csv')}>Export CSV</button>
          <button onClick={() => download('json')}>Export JSON</button>
        </div>
      </div>

      <details className="rk-weights"><summary>Weights</summary>
        <div className="rk-sliders">
          {[['rel', 'Condition match'], ['sev', 'Severity'], ['evi', 'Evidence strength']].map(([k, l]) =>
            <label key={k} className="rk-field"><span>{l} <em>{Math.round(w[k] * 100)}%</em></span>
              <input type="range" min="0" max="1" step="0.05" value={w[k]} onChange={e => setW(x => ({...x, [k]: Number(e.target.value)}))}/></label>)}
        </div>
        <button className="rk-link" onClick={() => setW(DEFAULT_WEIGHTS)}>Reset to 45 / 35 / 20</button>
      </details>
    </section>

    {sc.gravity_g > 0 && <p className="rk-note" aria-label="Partial-gravity notice">
      <b>No partial-gravity data.</b> PSI has no tests at {sc.gravity_g} g. Scores extrapolate between microgravity ({n0}) and 1 g ({n1}).
    </p>}
    {gaps.length > 0 && <section className="rk-gaps" aria-label="Evidence gaps">
      <h2><AlertTriangle size={14}/> Evidence gaps</h2>
      {gaps.map(g => <p key={g.finding_id}><b>{g.finding}</b> {g.safety_implication}</p>)}
    </section>}

    <ol className="rk-list">
      {shown.map(r => {
        const f = r.f, isOpen = open === f.finding_id, link = urlOf(f.source_file);
        return <li key={f.finding_id} className={`rk-item ${isOpen ? 'open' : ''}`}>
          <button className="rk-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.finding_id)}>
            <span className="rk-rank">{String(r.rank).padStart(2, '0')}</span>
            <span className="rk-main"><b>{f.finding}</b>
              <small>{f.experiment} · {f.theme} · <span className={`sev s${f.severity}`}>{SEV_LABEL[f.severity]}</span> · {f.confidence}{controlTags(f).map(t => <span key={t} className="rk-tag">{t}</span>)}</small></span>
            <span className="rk-score">{r.score.toFixed(1)}</span><ChevronDown size={15} className="rk-chev"/>
          </button>
          {isOpen && <div className="rk-detail">
            <p>{f.safety_implication}</p>
            <div className="rk-parts">
              <span>O₂<Bar v={r.o2}/></span><span>Pressure<Bar v={r.pr}/></span><span>Gravity<Bar v={r.gr}/></span><span>Evidence<Bar v={r.evi}/></span>
            </div>
            <dl>
              <dt>Tested</dt><dd>{f.material_or_fuel || 'n/a'} · {f.condition || 'n/a'} · O₂ {f.o2_pct_min ?? '?'}–{f.o2_pct_max ?? '?'}% · {f.gravity || 'gravity not stated'}{f.n_tests ? ` · n=${f.n_tests}` : ''}</dd>
              {f.quote && <><dt>Quote</dt><dd>“{f.quote}”{f.page ? ` (p. ${f.page})` : ''}</dd></>}
              {f.caveat && <><dt>Caveat</dt><dd>{f.caveat}</dd></>}
              <dt>Source</dt><dd>{link ? <a href={link} target="_blank" rel="noreferrer">{f.source_file.replace(link, '').trim() || 'NASA NTRS report'} <ExternalLink size={12}/></a> : f.source_file}{f.psi_id && ` · ${f.psi_id}`}</dd>
            </dl>
          </div>}
        </li>;
      })}
      {!shown.length && <li className="rk-empty">No findings match this theme and control type.</li>}
    </ol>
  </div>;
}
