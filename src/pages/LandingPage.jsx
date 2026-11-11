import React from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import MicroFlame from '../components/MicroFlame.jsx';
import FlameOrb from '../components/FlameOrb.jsx';
import HeroGrid from '../components/HeroGrid.jsx';

const TRACE_STEPS = [
  {k: '01 · ASK', t: 'You ask', d: '"cotton-fiberglass at 22% oxygen, 20 cm/s opposed"'},
  {k: '02 · READ', t: 'Flame reads it', d: 'material · oxygen · flow — recognized, not assumed'},
  {k: '03 · MATCH', t: 'Closest record found', d: 'BASS II · sample 2-5 · Cotton–fiberglass (SIBAL)'},
  {k: '04 · TRACE', t: 'Traced to its source', d: 'NASA PSI · Saffire II · source row 14'},
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

    <section className="l-logos">
      <span>Evidence sourced from</span>
      <div className="l-logos-row"><b>NASA PSI</b><b>NTRS</b><b>Saffire II</b><b>BASS II</b><b>FLEX</b></div>
    </section>

    <section className="l-trace">
      <div className="l-trace-head">
        <small>How it works</small>
        <h2>From a question to its NASA source</h2>
      </div>
      <div className="l-trace-flow">
        {TRACE_STEPS.map((n, i) => <React.Fragment key={n.k}>
          <div className="l-trace-node" style={{animationDelay: `${i * 1.8}s`}}>
            <small>{n.k}</small><b>{n.t}</b><span>{n.d}</span>
          </div>
          {i < TRACE_STEPS.length - 1 && <div className="l-trace-line"><i style={{animationDelay: `${i * 1.8}s`}}/></div>}
        </React.Fragment>)}
      </div>
    </section>

    <section className="l-final" id="cta">
      <div className="l-final-glow"/>
      <div className="l-final-inner">
        <div className="l-final-left">
          <h2>Explore the evidence with Flamme</h2>
          <p>Built for the Flame in Freefall challenge by Team Flamme. No NASA endorsement · no safety certification · no validated flame prediction.</p>
          <div className="l-cta-row">
            <a className="l-btn-secondary" href="https://github.com/farhanlabibahan/flamme" target="_blank" rel="noreferrer">View source <ArrowUpRight size={14}/></a>
          </div>
        </div>
        <div className="l-final-links">
          <div><b>Product</b><a onClick={() => jump('Lab')}>Lab</a><a onClick={() => jump('Ask')}>Ask</a><a onClick={() => jump('Evidence')}>Evidence</a><a onClick={() => jump('Compare')}>Compare</a></div>
          <div><b>Sources</b><a href="https://psi.nasa.gov" target="_blank" rel="noreferrer">NASA PSI</a><a href="https://github.com/farhanlabibahan/flamme" target="_blank" rel="noreferrer">GitHub</a></div>
        </div>
      </div>
      <footer className="landing-foot">No NASA endorsement · No safety certification · No validated flame prediction</footer>
    </section>
  </div>;
}
