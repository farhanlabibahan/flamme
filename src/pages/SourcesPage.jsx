import React from 'react';
import {useNavigate} from 'react-router-dom';
import {ExternalLink} from 'lucide-react';
import allInvestigations from '../investigationsData.json';
import reports from '../reportsData.json';
import {RESOURCES, CREDIT, SI_NOTE} from '../missionContext.js';
import './SourcesPage.css';

/* Real route: /sources. Every NASA source Flamme cites, in one place —
   replaces the old sidebar "drawer" popup, which only listed the 2
   investigations behind the 5-record Evidence demo (data.js) instead of the
   full 24-investigation catalog that Rankings/Investigations/Gap map/Model
   actually draw on. */
export default function SourcesPage() {
  const navigate = useNavigate();
  return <div className="sp reveal">
    <header>
      <span className="cmp-kicker">Sources</span>
      <h1>Every NASA source Flamme cites</h1>
      <p className="sp-lede">{allInvestigations.length} NASA PSI combustion investigations behind Evidence, Rankings and the Gap map,
        plus the PSI-69 (FLEX) and PSI-159 (CFI-G) sources behind the two trained models on the Lab page. For filtering, ranking and
        side-by-side comparison, use <button className="sp-link" onClick={() => navigate('/investigations')}>Investigations <ExternalLink size={12}/></button>.</p>
    </header>
    <h2 className="cmp-kicker">NASA PSI investigations</h2>
    <ul className="sp-list">
      {allInvestigations.map(i => <li key={i.id}>
        <div className="sp-main">
          <strong>{i.name}</strong><span className="sp-id">{i.id}</span>
          <small>{i.title === i.name ? i.platform : `${i.title} · ${i.platform}`}</small>
        </div>
        <div className="sp-links">
          <a href={i.url} target="_blank" rel="noreferrer">PSI page <ExternalLink size={12}/></a>
          {i.doi && <a href={`https://doi.org/${i.doi}`} target="_blank" rel="noreferrer">DOI <ExternalLink size={12}/></a>}
        </div>
      </li>)}
    </ul>

    {/* Built from flame_in_freefall_data/ntrs_reports.csv by findings/build_findings_data.py:
        only reports at least one finding cites. "Real-incident lesson" marks reports behind the
        Apollo 1, Apollo 13 and Mir rows, which are accident lessons, not controlled experiments. */}
    <h2 className="cmp-kicker">NASA technical reports (NTRS)</h2>
    <ul className="sp-list">
      {reports.map(r => <li key={r.id}>
        <div className="sp-main">
          <strong>{r.title}</strong><span className="sp-id">NTRS {r.id}</span>
          {r.incident && <span className="sp-tag">Real-incident lesson</span>}
          <small>{r.year} · {r.topic} · {r.findings} {r.findings === 1 ? 'finding' : 'findings'}</small>
        </div>
        <div className="sp-links">
          <a href={r.url} target="_blank" rel="noreferrer">NTRS page <ExternalLink size={12}/></a>
        </div>
      </li>)}
    </ul>
    {RESOURCES.map(g => <section key={g.group}>
      <h2 className="cmp-kicker">{g.group}</h2>
      <ul className="sp-list">
        {g.items.map(([t, u, d]) => <li key={u}>
          <div className="sp-main"><strong>{t}</strong><small>{d}</small></div>
          <div className="sp-links"><a href={u} target="_blank" rel="noreferrer">Open <ExternalLink size={12}/></a></div>
        </li>)}
      </ul>
    </section>)}
    <p className="sp-lede">{CREDIT}</p>
    <p className="sp-lede">{SI_NOTE}</p>
  </div>;
}
