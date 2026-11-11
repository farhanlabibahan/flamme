import React from 'react';
import {useNavigate} from 'react-router-dom';
import {ExternalLink} from 'lucide-react';
import allInvestigations from '../investigationsData.json';
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
        plus the same PSI-69 (FLEX) source behind the trained model on the Lab and Model pages. For filtering, ranking and
        side-by-side comparison, use <button className="sp-link" onClick={() => navigate('/investigations')}>Investigations <ExternalLink size={12}/></button>.</p>
    </header>
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
  </div>;
}
