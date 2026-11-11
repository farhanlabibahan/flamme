import React, {useMemo, useState} from 'react';
import {AlertTriangle, Grid3x3} from 'lucide-react';
import {findings} from '../ranking.js';
import './GapsPage.css';

/* Real route: /gaps. Plan item 3 ("Map the gaps"): which combinations of
   O2 and gravity have been tested, and which have none. Built from the same
   111-finding catalog as Rankings (findings/findings.csv -> findingsData.json),
   not a separate dataset. */

const O2_BINS = [
  {label: '<16%', test: v => v < 16},
  {label: '16–18%', test: v => v >= 16 && v < 18},
  {label: '18–21%', test: v => v >= 18 && v < 21},
  {label: '21–25%', test: v => v >= 21 && v < 25},
  {label: '25–30%', test: v => v >= 25 && v < 30},
  {label: '≥30%', test: v => v >= 30},
];

const GRAVITY_ROWS = [
  {label: 'Microgravity', test: g => /microgravity/i.test(g) && !/vs/i.test(g)},
  {label: 'Earth 1-g', test: g => /1-?g/i.test(g) && !/microgravity/i.test(g)},
  {label: 'Micro-g vs 1-g (comparison)', test: g => /microgravity/i.test(g) && /vs/i.test(g)},
];

function o2Mid(f) {
  if (f.o2_pct_min == null && f.o2_pct_max == null) return null;
  const lo = f.o2_pct_min ?? f.o2_pct_max, hi = f.o2_pct_max ?? f.o2_pct_min;
  return (lo + hi) / 2;
}

export default function GapsPage() {
  const [openCell, setOpenCell] = useState(null);
  const measured = useMemo(() => findings.filter(f => f.evidence_type !== 'evidence_gap'), []);
  const documentedGaps = useMemo(() => findings.filter(f => f.evidence_type === 'evidence_gap'), []);

  const grid = useMemo(() => GRAVITY_ROWS.map(row => ({
    row,
    cells: O2_BINS.map(col => {
      const rows = measured.filter(f => row.test(f.gravity || '') && o2Mid(f) != null && col.test(o2Mid(f)));
      return {col, rows};
    }),
  })), [measured]);

  const maxCount = Math.max(1, ...grid.flatMap(r => r.cells.map(c => c.rows.length)));
  const untested = grid.flatMap(r => r.cells.filter(c => c.rows.length === 0).map(c => `${r.row.label} × O2 ${c.col.label}`));
  const noGravityOrO2 = measured.filter(f => o2Mid(f) == null || !GRAVITY_ROWS.some(r => r.test(f.gravity || '')));

  return <div className="gm reveal">
    <header>
      <span className="cmp-kicker">Gap map</span>
      <h1>Which conditions have NASA actually tested?</h1>
      <p className="gm-lede">Every cell below is a count of catalog findings whose gravity regime and oxygen band fall in that cell,
        from the same 111-finding catalog as Rankings. An empty cell is not proof nothing was ever tested at that condition —
        it means nothing in this curated catalog documents it, which is itself useful: it is where the next experiment, or the
        next extraction pass over NASA PSI/NTRS sources, is most needed.</p>
    </header>

    {documentedGaps.length > 0 && <section className="gm-known" aria-label="NASA-documented gaps">
      <h2><AlertTriangle size={16}/> Gaps the sources call out directly</h2>
      {documentedGaps.map(g => <p key={g.finding_id}><b>{g.finding}</b> {g.safety_implication}</p>)}
    </section>}

    <section className="surface gm-grid-wrap">
      <h2><Grid3x3 size={15}/> Tests per gravity × oxygen band</h2>
      <div className="gm-grid" style={{gridTemplateColumns: `160px repeat(${O2_BINS.length}, 1fr)`}}>
        <div className="gm-corner"/>
        {O2_BINS.map(c => <div className="gm-colhead" key={c.label}>{c.label}</div>)}
        {grid.map(({row, cells}) => <React.Fragment key={row.label}>
          <div className="gm-rowhead">{row.label}</div>
          {cells.map(({col, rows}) => {
            const key = `${row.label}::${col.label}`;
            const open = openCell === key;
            const intensity = rows.length ? 0.15 + 0.7 * (rows.length / maxCount) : 0;
            return <button key={key} className={`gm-cell ${rows.length === 0 ? 'empty' : ''} ${open ? 'open' : ''}`}
              style={rows.length ? {background: `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--panel))`} : undefined}
              onClick={() => setOpenCell(open ? null : key)}
              title={`${row.label} × O2 ${col.label}: ${rows.length} finding${rows.length === 1 ? '' : 's'}`}>
              {rows.length || '—'}
            </button>;
          })}
        </React.Fragment>)}
      </div>
      <p className="gm-note">{untested.length} of {GRAVITY_ROWS.length * O2_BINS.length} cells have zero findings in this catalog.
        {noGravityOrO2.length > 0 && ` ${noGravityOrO2.length} findings could not be placed (gravity or O2 not reported) and are excluded from the grid.`}</p>
    </section>

    {openCell && (() => {
      const [rowLabel, colLabel] = openCell.split('::');
      const match = grid.find(r => r.row.label === rowLabel)?.cells.find(c => c.col.label === colLabel);
      return <section className="surface gm-detail">
        <h3>{rowLabel} × O2 {colLabel} — {match?.rows.length || 0} finding{match?.rows.length === 1 ? '' : 's'}</h3>
        <ul>{match?.rows.map(f => <li key={f.finding_id}><b>{f.material_or_fuel || f.experiment}</b> — {f.finding}</li>)}</ul>
      </section>;
    })()}
  </div>;
}
