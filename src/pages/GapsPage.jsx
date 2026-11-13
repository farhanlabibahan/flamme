import React, {useMemo, useState} from 'react';
import {DETECTOR_SPINOFF} from '../missionContext.js';
import {AlertTriangle, ExternalLink, SlidersHorizontal, X} from 'lucide-react';
import {findings} from '../ranking.js';
import {predictFlex, flexModelMeta} from '../flexModel.js';
import './GapsPage.css';

/* Real route: /gaps. Plan item 3 ("Map the gaps"): which combinations of
   O2 and gravity have been tested, and which have none. Built from the same
   115-finding catalog as Rankings (findings/findings.csv -> findingsData.json),
   not a separate dataset. Real-incident lessons (Apollo 1, Apollo 13, Mir) are
   not experiments, so they never count as test coverage here. The FLEX strip
   runs the actual trained model (src/flexModel.js) at each O2 band's midpoint,
   live from the sliders. */
const isIncident = f => f.metric === 'real-incident lesson';

const O2_BINS = [
  {label: '<16%', mid: 14, test: v => v < 16},
  {label: '16–18%', mid: 17, test: v => v >= 16 && v < 18},
  {label: '18–21%', mid: 19.5, test: v => v >= 18 && v < 21},
  {label: '21–25%', mid: 23, test: v => v >= 21 && v < 25},
  {label: '25–30%', mid: 27.5, test: v => v >= 25 && v < 30},
  {label: '≥30%', mid: 32, test: v => v >= 30},
];

const GRAVITY_ROWS = [
  {label: 'Microgravity', test: g => /microgravity/i.test(g) && !/vs/i.test(g)},
  {label: 'Earth 1-g', test: g => /1-?g/i.test(g) && !/microgravity/i.test(g)},
  {label: 'Micro-g vs 1-g', note: 'comparison', test: g => /microgravity/i.test(g) && /vs/i.test(g)},
];

function o2Mid(f) {
  if (f.o2_pct_min == null && f.o2_pct_max == null) return null;
  const lo = f.o2_pct_min ?? f.o2_pct_max, hi = f.o2_pct_max ?? f.o2_pct_min;
  return (lo + hi) / 2;
}

export default function GapsPage() {
  const [openCell, setOpenCell] = useState(null);
  const [pressureAtm, setPressureAtm] = useState(1);
  const [dropletDiameterMm, setDropletDiameterMm] = useState(1.7);
  const [fuelMethanol, setFuelMethanol] = useState(true);
  const measured = useMemo(() => findings.filter(f => f.evidence_type !== 'evidence_gap' && !isIncident(f)), []);
  const documentedGaps = useMemo(() => findings.filter(f => f.evidence_type === 'evidence_gap'), []);

  const grid = useMemo(() => GRAVITY_ROWS.map(row => ({
    row,
    cells: O2_BINS.map(col => {
      const rows = measured.filter(f => row.test(f.gravity || '') && o2Mid(f) != null && col.test(o2Mid(f)));
      return {col, rows};
    }),
  })), [measured]);

  const modelRow = useMemo(() => O2_BINS.map(col => predictFlex({o2Pct: col.mid, pressureAtm, dropletDiameterMm, fuelMethanol})),
    [pressureAtm, dropletDiameterMm, fuelMethanol]);

  const all = grid.flatMap(r => r.cells);
  const filled = all.filter(c => c.rows.length > 0).length;
  const total = all.length;
  const maxCount = Math.max(1, ...all.map(c => c.rows.length));
  const pr = flexModelMeta.trainingRange.pressure_atm, dr = flexModelMeta.trainingRange.droplet_diameter_mm;

  const detail = openCell && (() => {
    const [rowLabel, colLabel] = openCell.split('::');
    const match = grid.find(r => r.row.label === rowLabel)?.cells.find(c => c.col.label === colLabel);
    return {rowLabel, colLabel, rows: match?.rows || []};
  })();

  return <div className="gm reveal">
    <header className="gm-top">
      <div>
        <span className="cmp-kicker">Gap map</span>
        <h1>Which conditions has NASA actually tested?</h1>
      </div>
      <div className="gm-tally" aria-label="Coverage">
        <span><b>{filled}</b> / {total}</span>
        <small>cells with tests</small>
      </div>
    </header>

    {documentedGaps.length > 0 && <section className="gm-known" aria-label="NASA-documented gaps">
      <h2><AlertTriangle size={16}/> Gaps the sources call out directly</h2>
      <ul>{documentedGaps.map(g => <li key={g.finding_id}>{g.finding}{g.finding_id === 'GAP-DETECTOR-RESPONSE' && <> <a href={DETECTOR_SPINOFF.url} target="_blank" rel="noreferrer">Earth application: NASA’s shuttle-derived smoke detector (fewer nuisance alarms) <ExternalLink size={11}/></a></>}</li>)}</ul>
      <p className="gm-known-note">{documentedGaps[0].safety_implication}</p>
    </section>}

    <section className="gm-board" aria-label="Test coverage grid">
      <div className="gm-board-head">
        <h2>Tests per gravity × oxygen band</h2>
        <div className="gm-legend" aria-hidden="true">
          <span className="gm-sw gm-sw-empty"/>no tests
          <span className="gm-sw gm-sw-low"/>few
          <span className="gm-sw gm-sw-high"/>many
        </div>
      </div>

      <div className="gm-grid" style={{gridTemplateColumns: `150px repeat(${O2_BINS.length}, minmax(0,1fr))`}}>
        <div className="gm-corner">O₂</div>
        {O2_BINS.map(c => <div className="gm-colhead" key={c.label}>{c.label}</div>)}

        {grid.map(({row, cells}) => <React.Fragment key={row.label}>
          <div className="gm-rowhead">
            <b>{row.label}</b>
            {row.note && <small>{row.note}</small>}
          </div>
          {cells.map(({col, rows}) => {
            const key = `${row.label}::${col.label}`;
            const open = openCell === key;
            const level = rows.length / maxCount;
            return <button key={key}
              className={`gm-cell ${rows.length === 0 ? 'empty' : ''} ${open ? 'open' : ''}`}
              style={rows.length ? {'--lvl': `${Math.round(18 + level * 72)}%`} : undefined}
              onClick={() => setOpenCell(open ? null : key)}
              aria-label={`${row.label}, O2 ${col.label}: ${rows.length} finding${rows.length === 1 ? '' : 's'}`}>
              {rows.length ? <span className="gm-n">{rows.length}</span> : <span className="gm-none">no tests</span>}
            </button>;
          })}
        </React.Fragment>)}

        <div className="gm-rowhead gm-model-label"><b>FLEX model</b><small>predicted · live</small></div>
        {modelRow.map((pred, i) => {
          const pct = pred ? Math.round(pred.selfExtinguishProbability * 100) : null;
          return <div key={O2_BINS[i].label} className={`gm-model-cell ${pct == null ? 'empty' : ''}`}
            title={pct == null ? "Outside the model's trained range" : `${pct}% predicted self-extinguish probability`}
            style={pct != null ? {'--p': `${pct}%`} : undefined}>
            {pct != null ? <><span className="gm-pct">{pct}</span><small>%</small></> : <span className="gm-none">outside range</span>}
          </div>;
        })}
      </div>

      <div className="gm-controls">
        <div className="gm-ctl-head"><SlidersHorizontal size={14}/> Model inputs</div>
        <div className="gm-sliders">
          <label><span>Pressure</span><b>{pressureAtm.toFixed(2)} atm</b>
            <input type="range" min={pr[0]} max={pr[1]} step="0.01" value={pressureAtm} onChange={e => setPressureAtm(Number(e.target.value))}/></label>
          <label><span>Droplet diameter</span><b>{dropletDiameterMm.toFixed(2)} mm</b>
            <input type="range" min={dr[0]} max={dr[1]} step="0.01" value={dropletDiameterMm} onChange={e => setDropletDiameterMm(Number(e.target.value))}/></label>
          <div className="gm-fuel">
            <span>Fuel</span>
            <div className="gm-fuel-toggle">
              <button className={fuelMethanol ? 'on' : ''} onClick={() => setFuelMethanol(true)}>Methanol</button>
              <button className={!fuelMethanol ? 'on' : ''} onClick={() => setFuelMethanol(false)}>Heptane</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    {detail && <section className="gm-detail" aria-live="polite">
      <header>
        <div>
          <small>{detail.rowLabel} · O₂ {detail.colLabel}</small>
          <h3>{detail.rows.length} finding{detail.rows.length === 1 ? '' : 's'}</h3>
        </div>
        <button className="gm-close" aria-label="Close" onClick={() => setOpenCell(null)}><X size={16}/></button>
      </header>
      {detail.rows.length ? <ul>{detail.rows.map(f => <li key={f.finding_id}>
        <b>{f.material_or_fuel || f.experiment}</b>
        <span>{f.finding}</span>
      </li>)}</ul> : <p className="gm-none-note">No test in the catalog covers this combination.</p>}
    </section>}
  </div>;
}
