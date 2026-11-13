import React, {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, Flame, RotateCcw, Zap} from 'lucide-react';
import {Enum, NumField, PANELS} from '../Lab.jsx';
import {AGENTS, DEFAULT_PARAMS, DIRECTIONS, GRAVITY, MATERIALS, derive} from '../labModel.js';
import {flexModelMeta, nearestFlexTest, predictFlex} from '../flexModel.js';
import {cfigModelMeta, nearestCfigTest, predictCfig} from '../cfigModel.js';
import './LabPage.css';

/* Real route: /lab (sidebar entry). A setup page: pick a preset or tune the
   parameters, then "Enter the Lab" opens /lab/view in a new tab with only the
   chamber. Values travel through localStorage so the new tab starts from them. */
export const LAB_PARAMS_KEY = 'flamme-lab-params';

/* Ready-made starting points so nothing has to be clicked through by hand. */
const PRESETS = [
  {id: 'recommended', name: 'Recommended', sub: 'SIBAL test', icon: Flame, values: {}},
  {id: 'orbit', name: 'Microgravity', sub: 'No buoyancy', icon: Zap, values: {g: 0, flow: 20, direction: 'Concurrent'}},
  {id: 'earth', name: 'Earth buoyant', sub: '1 g plume', icon: Flame, values: {g: 1, flow: 5, direction: 'Concurrent'}},
  {id: 'opposed', name: 'Opposed flow', sub: 'Spreads upstream', icon: Zap, values: {g: 0, flow: 10, direction: 'Opposed'}},
  {id: 'suppress', name: 'CO₂ suppression', sub: '25% discharged', icon: Flame, values: {discharge: true, agent: 'CO₂', conc: 25}}
];

function loadSaved() {
  try { return {...DEFAULT_PARAMS, ...JSON.parse(localStorage.getItem(LAB_PARAMS_KEY) || '{}')}; }
  catch { return {...DEFAULT_PARAMS}; }
}

const nearestG = g => GRAVITY.reduce((a, b) => Math.abs(b.g - g) < Math.abs(a.g - g) ? b : a);
const matches = (params, values) => Object.entries(values).every(([k, v]) => params[k] === v);

function Section({panel, params, change}) {
  return <article className="lp-cell">
    <header className="lp-head">
      <span className="lp-n">{String(panel.n).padStart(2, '0')}</span>
      <h3>{panel.title}</h3>
    </header>
    <div className="lp-body">
      {panel.keys.map(k => {
        if (k === 'material') return <Enum key={k} k={k} label="Material" value={params.material} onChange={change} options={Object.entries(MATERIALS).map(([v, m]) => [v, `${m.short} · ${m.note}`])}/>;
        if (k === 'direction') return <Enum key={k} k={k} label="Direction" value={params.direction} onChange={change} options={DIRECTIONS}/>;
        if (k === 'agent') return <Enum key={k} k={k} label="Agent" value={params.agent} onChange={change} options={AGENTS}/>;
        if (k === 'discharge') return <button key={k} className={`bt lp-toggle ${params.discharge ? 'on' : ''}`} onClick={() => change('discharge', !params.discharge)} disabled={params.agent === 'None'}>{params.discharge ? 'Discharging' : 'Discharge agent'}</button>;
        return <NumField key={k} k={k} value={params[k]} onChange={change}/>;
      })}
      {panel.id === 'gravity' && <div className="pills">{GRAVITY.map(g => <button key={g.name} className={nearestG(params.g).name === g.name ? 'on' : ''} onClick={() => change('g', g.g)}>{g.name}</button>)}</div>}
    </div>
  </article>;
}

export default function LabPage() {
  const navigate = useNavigate();
  const [params, setParams] = useState(loadSaved);
  const change = (k, v) => setParams(p => ({...p, [k]: v}));
  const applyPreset = p => setParams({...DEFAULT_PARAMS, ...p.values});
  const regime = useMemo(() => derive(params).regime, [params]);
  const grounded = useMemo(() => {
    const pressureAtm = params.pressure / 101.325;
    const pred = predictFlex({o2Pct: params.oxygen, pressureAtm});
    const nearest = nearestFlexTest({o2Pct: params.oxygen, pressureAtm});
    return {pred, nearest, pressureAtm};
  }, [params.oxygen, params.pressure]);

  const cfig = useMemo(() => {
    const pressureBar = params.pressure / 100;   // lab pressure is kPa; 100 kPa = 1 bar
    return {pred: predictCfig({o2Pct: params.oxygen, pressureBar}), nearest: nearestCfigTest({o2Pct: params.oxygen, pressureBar})};
  }, [params.oxygen, params.pressure]);

  const enter = () => {
    localStorage.setItem(LAB_PARAMS_KEY, JSON.stringify(params));
    window.open('/lab/view', '_blank', 'noopener');
  };

  return <section className="lp" id="lab">
    <header className="lp-top">
      <h1>Set up the chamber</h1>
      <div className="lp-regime"><span>Predicted regime</span><strong>{regime}</strong></div>
    </header>

    <div className="lp-presets" role="radiogroup" aria-label="Presets">
      {PRESETS.map(p => {
        const Icon = p.icon;
        const on = matches(params, {...DEFAULT_PARAMS, ...p.values});
        return <button key={p.id} role="radio" aria-checked={on} className={`lp-preset ${on ? 'on' : ''}`} onClick={() => applyPreset(p)}>
          <Icon size={15} strokeWidth={1.75}/>
          <span className="lp-preset-name">{p.name}</span>
          <span className="lp-preset-sub">{p.sub}</span>
        </button>;
      })}
    </div>

    <section className="lp-ground" aria-label="Grounded estimate">
      <header className="lp-ground-head">
        <h2>Grounded in NASA FLEX data</h2>
        <button className="lp-link" onClick={() => navigate('/model')}>Trained model →</button>
      </header>
      {grounded.pred ? <div className="lp-stats">
        <div>
          <span>Self-extinguish probability</span>
          <b>{Math.round(grounded.pred.selfExtinguishProbability * 100)}%</b>
          <small>{flexModelMeta.classifierMetrics.n_train + flexModelMeta.classifierMetrics.n_test} tests · AUC {flexModelMeta.classifierMetrics.auc}</small>
        </div>
        <div>
          <span>Burning-rate constant K</span>
          <b>{grounded.pred.burningRateK.toFixed(2)} mm²/s</b>
          <small>R² {flexModelMeta.regressorMetrics.r2}</small>
        </div>
      </div> : <p className="lp-oor">
        Outside the tested envelope: FLEX covers O₂ {flexModelMeta.trainingRange.o2_pct[0]}–{flexModelMeta.trainingRange.o2_pct[1]}%
        and {flexModelMeta.trainingRange.pressure_atm[0].toFixed(2)}–{flexModelMeta.trainingRange.pressure_atm[1].toFixed(2)} atm.
      </p>}
      {grounded.nearest && <p className="lp-nearest">
        <span>Closest test</span>
        {grounded.nearest.fuel} · {grounded.nearest.o2_pct}% O₂ · {grounded.nearest.pressure_atm} atm ·{' '}
        {grounded.nearest.self_extinguished == null ? 'outcome not reported'
          : grounded.nearest.self_extinguished ? `self-extinguished at ${grounded.nearest.extinction_diameter_mm ?? '?'} mm` : 'burned to completion'}
        {' '}<a href={grounded.nearest.source_url} target="_blank" rel="noreferrer">{grounded.nearest.report_id} ↗</a>
      </p>}
    </section>

    <section className="lp-ground" aria-label="Grounded ignition estimate">
      <header className="lp-ground-head">
        <h2>Grounded in NASA CFI-G data (gaseous fuels)</h2>
      </header>
      {cfig.pred ? <div className="lp-stats">
        {Object.entries(cfig.pred).map(([fuel, p]) => <div key={fuel}>
          <span>Hot-ignition probability · {fuel}</span>
          <b>{Math.round(p * 100)}%</b>
          <small>{cfigModelMeta.nTests} tests · held-out AUC {cfigModelMeta.metrics.auc} (5-fold {cfigModelMeta.metrics.cv5_auc_mean})</small>
        </div>)}
      </div> : <p className="lp-oor">
        Outside the tested envelope: CFI-G covers O₂ {cfigModelMeta.trainingRange.o2_pct[0].toFixed(0)}–{cfigModelMeta.trainingRange.o2_pct[1].toFixed(0)}%
        and {cfigModelMeta.trainingRange.p_bar[0].toFixed(2)}–{cfigModelMeta.trainingRange.p_bar[1].toFixed(2)} bar.
      </p>}
      {cfig.nearest && <p className="lp-nearest">
        <span>Closest test</span>
        {cfig.nearest.fuel} · {cfig.nearest.o2_pct}% O₂ · {cfig.nearest.pressure_bar} bar · {cfig.nearest.hot_ignition ? 'hot ignition' : 'no hot ignition'}
        {' '}<a href={cfig.nearest.source_url} target="_blank" rel="noreferrer">PSI-159 row {cfig.nearest.source_row} ↗</a>
      </p>}
      <p className="lp-nearest"><span>Scope</span>Gaseous-fuel flames, not solid materials. Modest skill: it beats always guessing “ignites” ({Math.round(cfigModelMeta.metrics.majority_class_accuracy * 100)}% accuracy) by only a few points on held-out tests.</p>
    </section>

    <div className="lp-grid">
      {PANELS.map(panel => <Section key={panel.id} panel={panel} params={params} change={change}/>)}
    </div>

    <footer className="lp-bar">
      <button className="lp-reset" onClick={() => setParams({...DEFAULT_PARAMS})}><RotateCcw size={14}/> Reset to defaults</button>
      <button className="lp-enter" onClick={enter}>Enter the Lab <ArrowRight size={16}/></button>
    </footer>
  </section>;
}
