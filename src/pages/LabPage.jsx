import React, {useMemo, useState} from 'react';
import {ArrowRight, Flame, RotateCcw, Zap} from 'lucide-react';
import {Enum, NumField, PANELS} from '../Lab.jsx';
import {AGENTS, DEFAULT_PARAMS, DIRECTIONS, GRAVITY, MATERIALS, derive} from '../labModel.js';

/* Real route: /lab (sidebar entry). A setup page: pick a preset or tune the
   parameters, then "Enter the Lab" opens /lab/view in a new tab with only the
   chamber. Values travel through localStorage so the new tab starts from them. */
export const LAB_PARAMS_KEY = 'flamme-lab-params';

/* Ready-made starting points so nothing has to be clicked through by hand. */
const PRESETS = [
  {id: 'recommended', name: 'Recommended', sub: 'Default SIBAL test', icon: Flame, values: {}},
  {id: 'orbit', name: 'Microgravity', sub: 'Orbit · no buoyancy', icon: Zap, values: {g: 0, flow: 20, direction: 'Concurrent'}},
  {id: 'earth', name: 'Earth buoyant', sub: '1 g · rising plume', icon: Flame, values: {g: 1, flow: 5, direction: 'Concurrent'}},
  {id: 'opposed', name: 'Opposed flow', sub: 'Flame spreads upstream', icon: Zap, values: {g: 0, flow: 10, direction: 'Opposed'}},
  {id: 'suppress', name: 'CO₂ suppression', sub: '25% agent discharged', icon: Flame, values: {discharge: true, agent: 'CO₂', conc: 25}}
];

function loadSaved() {
  try { return {...DEFAULT_PARAMS, ...JSON.parse(localStorage.getItem(LAB_PARAMS_KEY) || '{}')}; }
  catch { return {...DEFAULT_PARAMS}; }
}

const nearestG = g => GRAVITY.reduce((a, b) => Math.abs(b.g - g) < Math.abs(a.g - g) ? b : a);
const matches = (params, values) => Object.entries(values).every(([k, v]) => params[k] === v);

function Section({panel, params, change}) {
  const Icon = panel.icon;
  return <article className="sc-card">
    <header className="sc-head">
      <span className="sc-icon"><Icon size={15}/></span>
      <span className="sc-title">{panel.title}</span>
      <em className="sc-n">{String(panel.n).padStart(2, '0')}</em>
    </header>
    <div className="sc-body">
      {panel.keys.map(k => {
        if (k === 'material') return <Enum key={k} k={k} label="Material" value={params.material} onChange={change} options={Object.entries(MATERIALS).map(([v, m]) => [v, `${m.short} · ${m.note}`])}/>;
        if (k === 'direction') return <Enum key={k} k={k} label="Direction" value={params.direction} onChange={change} options={DIRECTIONS}/>;
        if (k === 'agent') return <Enum key={k} k={k} label="Agent" value={params.agent} onChange={change} options={AGENTS}/>;
        if (k === 'discharge') return <button key={k} className={`bt sc-toggle ${params.discharge ? 'on' : ''}`} onClick={() => change('discharge', !params.discharge)} disabled={params.agent === 'None'}>{params.discharge ? 'Discharging' : 'Discharge agent'}</button>;
        return <NumField key={k} k={k} value={params[k]} onChange={change}/>;
      })}
      {panel.id === 'gravity' && <div className="pills">{GRAVITY.map(g => <button key={g.name} className={nearestG(params.g).name === g.name ? 'on' : ''} onClick={() => change('g', g.g)}>{g.name}</button>)}</div>}
    </div>
  </article>;
}

export default function LabPage() {
  const [params, setParams] = useState(loadSaved);
  const change = (k, v) => setParams(p => ({...p, [k]: v}));
  const applyPreset = p => setParams({...DEFAULT_PARAMS, ...p.values});
  const regime = useMemo(() => derive(params).regime, [params]);

  const enter = () => {
    localStorage.setItem(LAB_PARAMS_KEY, JSON.stringify(params));
    window.open('/lab/view', '_blank', 'noopener');
  };

  return <section className="lab-setup" id="lab">
    <header className="ls-hero">
      <div>
        <span className="ls-kicker">Flamme · Lab</span>
        <h1>Set up the chamber</h1>
        <p>Start from a preset, fine-tune any parameter, then enter the lab in a new tab.</p>
      </div>
      <div className="ls-regime"><span>Predicted regime</span><strong>{regime}</strong></div>
    </header>

    <div className="ls-presets" role="radiogroup" aria-label="Presets">
      {PRESETS.map(p => {
        const Icon = p.icon;
        const on = matches(params, {...DEFAULT_PARAMS, ...p.values});
        return <button key={p.id} role="radio" aria-checked={on} className={`ls-preset ${on ? 'on' : ''}`} onClick={() => applyPreset(p)}>
          <span className="ls-preset-icon"><Icon size={16}/></span>
          <span className="ls-preset-name">{p.name}</span>
          <span className="ls-preset-sub">{p.sub}</span>
        </button>;
      })}
    </div>

    <div className="ls-grid">
      {PANELS.map(panel => <Section key={panel.id} panel={panel} params={params} change={change}/>)}
    </div>

    <footer className="ls-bar">
      <button className="ls-reset" onClick={() => setParams({...DEFAULT_PARAMS})}><RotateCcw size={14}/> Reset to defaults</button>
      <button className="ls-enter" onClick={enter}>Enter the Lab <ArrowRight size={16}/></button>
    </footer>
  </section>;
}
