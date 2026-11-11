import React, {useState} from 'react';
import {NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {BookOpen, ChevronsLeft, ChevronsRight, Compass, ExternalLink, FileJson, FlaskConical, Grid3x3, Layers, ListOrdered, Sigma, Table2, Globe, Sparkles, X} from 'lucide-react';
import {useFlamme} from '../context/FlammeContext.jsx';
import MicroFlame from './MicroFlame.jsx';

const NAV = [
  {to: '/lab', label: 'Lab', icon: FlaskConical, prefetch: () => import('../pages/LabPage.jsx')},
  {to: '/ask', label: 'Ask', icon: Sparkles, prefetch: () => import('../pages/AskPage.jsx')},
  {to: '/evidence', label: 'Evidence', icon: Compass, prefetch: () => import('../pages/EvidencePage.jsx')},
  {to: '/rankings', label: 'Rankings', icon: ListOrdered, prefetch: () => import('../pages/RankingsPage.jsx')},
  {to: '/investigations', label: 'Investigations', icon: Table2, prefetch: () => import('../pages/InvestigationsPage.jsx')},
  {to: '/earth', label: 'On Earth', icon: Globe, prefetch: () => import('../pages/EarthPage.jsx')},
  {to: '/compare', label: 'Compare', icon: Layers, prefetch: () => import('../pages/ComparePage.jsx')},
  {to: '/gaps', label: 'Gap map', icon: Grid3x3, prefetch: () => import('../pages/GapsPage.jsx')},
  {to: '/template', label: 'Template', icon: FileJson, prefetch: () => import('../pages/TemplatePage.jsx')},
  {to: '/model', label: 'Model', icon: Sigma, prefetch: () => import('../pages/ModelPage.jsx')},
  {to: '/sources', label: 'Sources', icon: BookOpen, prefetch: () => import('../pages/SourcesPage.jsx')},
];

const warmed = new Set();
function warm(to, loader) {
  if (warmed.has(to)) return;
  warmed.add(to);
  loader().catch(() => { warmed.delete(to); });
}

/* Persistent app frame: sidebar + source drawer + <Outlet/>. Each sidebar
   item is a real react-router route (/lab, /ask, /evidence, /compare) — not
   a client-state flag — so every section is its own code-split bundle,
   the URL/back-button work, and the heavy Lab (Three.js) chunk only loads
   when its route is actually visited. Hovering/focusing a link warms that
   route's module ahead of the click (like Next's <Link prefetch>), and a
   150ms click-throttle guards the sidebar's slide/sweep animation from being
   re-triggered by an accidental double click mid-transition. */
export default function Shell() {
  const {drawer, setDrawer, compare, record, source} = useFlamme();
  const navigate = useNavigate();
  const location = useLocation();
  const [navCollapsed, setNavCollapsed] = useState(() => { try { return localStorage.getItem('flamme-nav-collapsed') === '1'; } catch { return false; } });
  const toggleNav = () => setNavCollapsed(c => { const n = !c; try { localStorage.setItem('flamme-nav-collapsed', n ? '1' : '0'); } catch {} return n; });

  return <div className={`app-shell ${navCollapsed ? 'nav-collapsed' : ''}`}>
    <aside className="side-nav">
      <div className="side-head">
        <button className="identity" onClick={() => navigate('/evidence')} aria-label="Flamme home">
          <span className="brand-flame"><MicroFlame/></span><span className="identity-wordmark">Flamme</span>
        </button>
        <button className="nav-collapse-btn" onClick={toggleNav} aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {navCollapsed ? <ChevronsRight size={18}/> : <ChevronsLeft size={18}/>}
        </button>
      </div>
      <div className="nav-overline">WORKSPACE</div>
      {NAV.map(({to, label, icon: Icon, prefetch}) =>
        <NavLink key={to} to={to}
          onMouseEnter={() => warm(to, prefetch)}
          onFocus={() => warm(to, prefetch)}
          onClick={() => setDrawer(null)}
          className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
          title={navCollapsed ? label : undefined}>
          <Icon size={19}/><span className="nav-link-text">{label}</span>{label === 'Compare' && <em>{compare.length}</em>}
        </NavLink>
      )}
    </aside>
    <main className="workspace">
      <div className="workspace-inner">{/* /lab is now a setup form; the 3D chamber lives at /lab/view */}
        {drawer === 'source' && <section className="surface source-panel" role="region" aria-label="Source information">
          <button className="drawer-close" aria-label="Close" onClick={() => setDrawer(null)}><X/></button>
          <small>DATA LINEAGE</small><h2>{source.name} · sample {record.id}</h2>
          <p>{source.title} on {source.platform}. The displayed values come from local CSV <strong>{record.source.file}</strong>, <mark className="trace">row {record.source.row}</mark> (header is row 1).</p>
          <div className="lineage-box">Source table → experiment {record.id} → observed card → cautious interpretation</div>
          <p>{record.source.notes}</p>
          <a href={source.url} target="_blank" rel="noreferrer">Open NASA PSI investigation <ExternalLink size={15}/></a>
          <a href={`https://doi.org/${source.doi}`} target="_blank" rel="noreferrer">DOI {source.doi} <ExternalLink size={15}/></a>
        </section>}
        <div className="view-transition" key={location.pathname}>
          <Outlet/>
        </div>
        <footer className="page-foot">NASA PSI source excerpts · Flamme by Team Flamme <span>No NASA endorsement · No safety certification · No validated flame prediction</span></footer>
      </div>
    </main>
  </div>;
}
