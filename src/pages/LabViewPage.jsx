import React, {useMemo} from 'react';
import Lab from '../Lab.jsx';
import {DEFAULT_PARAMS} from '../labModel.js';
import {LAB_PARAMS_KEY} from './LabPage.jsx';

/* Real route: /lab/view, opened in its own tab by "Enter the Lab". Outside the
   app shell on purpose: no sidebar, only the chamber and its parameter panel. */
export default function LabViewPage() {
  const initialParams = useMemo(() => {
    try { return {...DEFAULT_PARAMS, ...JSON.parse(localStorage.getItem(LAB_PARAMS_KEY) || '{}')}; }
    catch { return {...DEFAULT_PARAMS}; }
  }, []);
  return <div className="lab-standalone">
    <Lab scenario={{}} mode="Illustrative visualization" onMode={() => {}} reduced={false} onReduced={() => {}} initialParams={initialParams}/>
  </div>;
}
