import React from 'react';
import {Link} from 'react-router-dom';
import {findings} from '../ranking.js';
import './EarthPage.css';

/* Real route: /earth. Spin-offs named in the challenge brief, tied to the
   catalog themes they draw on. Descriptions stay at the level the brief states;
   no performance numbers are claimed here. */
const APPS = [
  {t: 'Fine-water-mist extinguishers', from: 'Suppression', themes: ['Droplet / liquid-fuel fires', 'Suppression / ventilation'],
    s: 'Mist extinguishers developed for the ISS have practical uses on Earth. Space suppression work (FLEX: dilution with CO₂ and helium, and how flames go out) informs how any agent must work without buoyancy-driven mixing.'},
  {t: 'Smoke detection', from: 'Detection', themes: ['Smoke & detection'],
    s: 'NASA technology has led to improvements in terrestrial smoke detection. SAME and SAME-R measured smoke particle size from different materials, and DAFT showed the same instrument can detect dust, informing detector design and placement.'},
  {t: 'Firefighter gear', from: 'Prevention', themes: ['Solid-material flammability', 'Large-scale spacecraft fire'],
    s: 'NASA technology has likewise improved firefighter protective clothing and air tanks. Material flammability results (BASS, Saffire) show how fabrics burn and spread flame under controlled airflow and oxygen.'},
];
const count = ts => findings.filter(f => ts.includes(f.theme) && f.evidence_type !== 'evidence_gap').length;

export default function EarthPage() {
  return <div className="ea reveal">
    <span className="cmp-kicker">Earth applications</span>
    <h1>Fire safety on Earth, from fire safety in space</h1>
    <p className="rk-lede">Microgravity removes buoyancy, so it isolates what really controls a flame. That makes the data useful beyond spacecraft.</p>
    <div className="ea-grid">{APPS.map(a => <article key={a.t} className="surface ea-card">
      <small>{a.from}</small><h2>{a.t}</h2><p>{a.s}</p>
      <footer>{count(a.themes)} source-linked findings · {a.themes.join(' · ')}</footer>
    </article>)}</div>
    <p className="iv-note">Source-linked findings live in <Link to="/rankings">Rankings</Link>; the investigations behind them are in <Link to="/investigations">Investigations</Link>. These are application areas named in the challenge brief, not validated performance claims.</p>
  </div>;
}
