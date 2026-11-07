import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ParamPanel} from '../Lab.jsx';
import {DEFAULT_PARAMS} from '../labModel.js';

/* Real route: /lab (sidebar entry). A setup form, not the 3D chamber: the
   parameters are editable here, and "Enter the Lab" opens /lab/view in a new
   tab with only the chamber and its parameter panel. The chosen values travel
   through localStorage, so the new tab starts from exactly what was set. */
export const LAB_PARAMS_KEY = 'flamme-lab-params';

function loadSaved() {
  try { return {...DEFAULT_PARAMS, ...JSON.parse(localStorage.getItem(LAB_PARAMS_KEY) || '{}')}; }
  catch { return {...DEFAULT_PARAMS}; }
}

export default function LabPage() {
  const [params, setParams] = useState(loadSaved);
  const [open, setOpen] = useState(() => ({}));
  const change = (k, v) => setParams(p => ({...p, [k]: v}));

  const enter = () => {
    localStorage.setItem(LAB_PARAMS_KEY, JSON.stringify(params));
    window.open('/lab/view', '_blank', 'noopener');
  };

  return <section className="lab-setup" id="lab">
    <div className="setup-head">
      <h1>Lab setup</h1>
      <p>Set the parameters, then enter the lab. It opens in a new tab.</p>
    </div>
    <ParamPanel className="setup-panel" params={params} open={open} setOpen={setOpen} change={change}/>
    <div className="setup-actions">
      <button className="setup-reset" onClick={() => setParams({...DEFAULT_PARAMS})}>Reset to defaults</button>
      <button className="setup-enter" onClick={enter}>Enter the Lab</button>
    </div>
  </section>;
}

