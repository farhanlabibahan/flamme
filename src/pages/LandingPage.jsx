import React from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, ArrowUpRight, Atom, BookOpen, Flame, Microscope, Satellite} from 'lucide-react';
import MicroFlame from '../components/MicroFlame.jsx';
import FlameOrb from '../components/FlameOrb.jsx';
import HeroGrid from '../components/HeroGrid.jsx';
import {INCIDENTS, SPINOFFS, CREDIT} from '../missionContext.js';

const SOURCES = [
  {name: 'NASA PSI', icon: Satellite},
  {name: 'NTRS', icon: BookOpen},
  {name: 'Saffire II', icon: Flame},
  {name: 'BASS II', icon: Atom},
  {name: 'FLEX', icon: Microscope},
];

const TRACE_STEPS = [
  {t: 'You ask', d: 'cotton-fiberglass · 22% O₂ · 20 cm/s opposed'},
  {t: 'Flame reads it', d: 'material · oxygen · flow'},
  {t: 'Closest record', d: 'BASS II · sample 2-5'},
  {t: 'Traced to source', d: 'NASA PSI · Saffire II · row 14'},
];

/* Real route: / — the one page outside the app shell. "Enter Flamme" and the
   footer product links now push real URLs (/lab, /ask, /evidence)
   instead of flipping a client-side view flag. */
export default function LandingPage() {
  const navigate = useNavigate();
  const jump = v => navigate(`/${v.toLowerCase()}`);
  const scrollTo = id => e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({behavior: 'smooth'}); };

  return <div className="landing">
    <nav className="l-nav">
      <span className="l-wordmark"><span className="brand-flame"><MicroFlame/></span>Flamme</span>
    </nav>

    <header className="l-hero">
      <div className="l-hero-overlay"/>
      <HeroGrid/>
      <div className="l-hero-inner">
        <div className="l-hero-text">
          <h1><span className="l-h1-line">Fire evidence,</span><br/><span className="l-h1-line">without the guesswork.</span></h1>
          <p>An interactive microgravity flame lab and a source-linked evidence explorer for NASA's combustion data.</p>
          <div className="l-cta-row">
            <button className="l-btn-primary l-btn-wide" onClick={() => navigate('/lab')}>Enter Flamme <ArrowRight size={16}/></button>
            <a className="l-btn-secondary" href="#cta" onClick={scrollTo('cta')}>View source</a>
          </div>
        </div>
        <div className="l-blade-group" aria-hidden="true">
          <FlameOrb width={400} height={540}/>
        </div>
      </div>
    </header>

    <section className="l-sources" aria-label="Data sources">
      <ul className="l-sources-row">
        {SOURCES.map(s => <li key={s.name}><s.icon size={16} strokeWidth={1.75}/><span>{s.name}</span></li>)}
      </ul>
    </section>

    <section className="l-trace">
      <h2>From a question to its NASA source</h2>
      <ol className="l-steps">
        {TRACE_STEPS.map((n, i) => <li key={n.t} className="l-step" style={{animationDelay: `${i * 1.8}s`}}>
          <span className="l-step-n">{String(i + 1).padStart(2, '0')}</span>
          <b>{n.t}</b>
          <code>{n.d}</code>
        </li>)}
      </ol>
    </section>

    <section className="l-why">
      <h2>Why fire in space is different</h2>
      <ul className="l-why-row">
        {INCIDENTS.map(i => <li key={i.name}>
          <b>{i.name}</b><em>{i.year}</em>
          <p>{i.d}</p>
          <a href={i.url} target="_blank" rel="noreferrer">NASA lessons learned <ArrowUpRight size={13}/></a>
        </li>)}
      </ul>
    </section>

    <section className="l-why">
      <h2>Fire safety on Earth, too</h2>
      <ul className="l-why-row">
        {SPINOFFS.map(i => <li key={i.name}>
          <b>{i.name}</b><em>{i.era}</em>
          <p>{i.d}</p>
          <p><small>{i.link}</small></p>
          <a href={i.url} target="_blank" rel="noreferrer">NASA Spinoff <ArrowUpRight size={13}/></a>
        </li>)}
      </ul>
    </section>

    <section className="l-final" id="cta">
      <div className="l-final-card">
        <h2>Explore the evidence with Flamme</h2>
        <div className="l-final-actions">
          <button className="l-final-primary" onClick={() => navigate('/lab')}>Enter Flamme <ArrowRight size={16}/></button>
          <a className="l-final-ghost" href="https://github.com/farhanlabibahan/flamme" target="_blank" rel="noreferrer">View source <ArrowUpRight size={15}/></a>
        </div>
        <div className="l-final-links">
          <div><b>Product</b><a onClick={() => jump('Lab')}>Lab</a><a onClick={() => jump('Ask')}>Ask</a><a onClick={() => jump('Evidence')}>Evidence</a><a onClick={() => jump('Rankings')}>Rankings</a></div>
          <div><b>Sources</b><a href="https://psi.nasa.gov" target="_blank" rel="noreferrer">NASA PSI</a><a href="https://github.com/farhanlabibahan/flamme" target="_blank" rel="noreferrer">GitHub</a></div>
        </div>
        <p className="l-credit">{CREDIT}</p>
      </div>
    </section>
  </div>;
}
