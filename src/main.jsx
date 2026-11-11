import React, {lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {FlammeProvider} from './context/FlammeContext.jsx';
import Shell from './components/Shell.jsx';
import LandingPage from './pages/LandingPage.jsx';
import CubeLoader from './components/ui/CubeLoader.jsx';
import {AskSkeleton, CompareSkeleton, EvidenceSkeleton} from './components/ui/Skeleton.jsx';
import './app.css';
import './components/ui/Skeleton.css';

/* Each sidebar app now lives at its own endpoint and its own lazy chunk:
   /lab, /ask, /evidence, /compare. Previously the whole app was one
   component that swapped a `view` string — every section's code (including
   the Three.js lab) shipped in one bundle and re-rendered inside the same
   tree, which is what made switching sections feel heavy. Real routes mean
   the router only mounts the page you asked for, React.lazy code-splits
   each one into its own file fetched on demand, and Shell's hover-prefetch
   warms the next click before it happens. */
const LabPage = lazy(() => import('./pages/LabPage.jsx'));
const LabViewPage = lazy(() => import('./pages/LabViewPage.jsx'));
const AskPage = lazy(() => import('./pages/AskPage.jsx'));
const EvidencePage = lazy(() => import('./pages/EvidencePage.jsx'));
const ComparePage = lazy(() => import('./pages/ComparePage.jsx'));
const InvestigationsPage = lazy(() => import('./pages/InvestigationsPage.jsx'));
const EarthPage = lazy(() => import('./pages/EarthPage.jsx'));
const RankingsPage = lazy(() => import('./pages/RankingsPage.jsx'));
const GapsPage = lazy(() => import('./pages/GapsPage.jsx'));
const TemplatePage = lazy(() => import('./pages/TemplatePage.jsx'));

function App() {
  return <BrowserRouter>
    <FlammeProvider>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route element={<Shell/>}>
          <Route path="/lab" element={<Suspense fallback={<CubeLoader message="Loading lab…" fullHeight/>}><LabPage/></Suspense>}/>
          <Route path="/ask" element={<Suspense fallback={<AskSkeleton/>}><AskPage/></Suspense>}/>
          <Route path="/evidence" element={<Suspense fallback={<EvidenceSkeleton/>}><EvidencePage/></Suspense>}/>
          <Route path="/investigations" element={<Suspense fallback={<CubeLoader message="Loading investigations…" fullHeight/>}><InvestigationsPage/></Suspense>}/>
          <Route path="/earth" element={<Suspense fallback={<CubeLoader message="Loading…" fullHeight/>}><EarthPage/></Suspense>}/>
          <Route path="/rankings" element={<Suspense fallback={<CubeLoader message="Loading rankings…" fullHeight/>}><RankingsPage/></Suspense>}/>
          <Route path="/compare" element={<Suspense fallback={<CompareSkeleton/>}><ComparePage/></Suspense>}/>
          <Route path="/gaps" element={<Suspense fallback={<CubeLoader message="Loading gap map…" fullHeight/>}><GapsPage/></Suspense>}/>
          <Route path="/template" element={<Suspense fallback={<CubeLoader message="Loading template…" fullHeight/>}><TemplatePage/></Suspense>}/>
        </Route>
        <Route path="/lab/view" element={<Suspense fallback={<CubeLoader message="Loading lab…" fullHeight/>}><LabViewPage/></Suspense>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </FlammeProvider>
  </BrowserRouter>;
}

createRoot(document.getElementById('root')).render(<App/>);
