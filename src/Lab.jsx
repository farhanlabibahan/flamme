import {ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpFromLine, Box, ChevronDown, Circle, Fan, Flame, Globe, Layers, Maximize2, Minimize2, Mouse, Orbit, RectangleHorizontal, RotateCcw, Scan, ShieldAlert, Thermometer, Video, Wind, Zap} from 'lucide-react';
import React, {forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {AGENTS, DEFAULT_PARAMS, DIRECTIONS, FIELDS, GRAVITY, MATERIALS, SIBAL} from './labModel.js';
import {rafThrottle} from './hooks/useRafThrottle.js';
import CubeLoader from './components/ui/CubeLoader.jsx';

/* Blender-style workspace around an ILLUSTRATIVE chamber visualization.
   Inputs are the ten controlled parameters of the evidence catalogue; the
   flame's response is qualitative and never a measured or simulated result. */

export const PANELS = [
  {n: 1, id: 'material', title: 'Material / fuel', icon: Layers, keys: ['material']},
  {n: 2, id: 'geometry', title: 'Sample geometry', icon: Box, keys: ['length', 'width', 'thickness']},
  {n: 3, id: 'gravity', title: 'Gravity condition', icon: Globe, keys: ['g']},
  {n: 4, id: 'oxygen', title: 'Oxygen concentration', icon: Circle, keys: ['oxygen']},
  {n: 5, id: 'pressure', title: 'Ambient pressure', icon: Scan, keys: ['pressure']},
  {n: 6, id: 'flow', title: 'Forced airflow', icon: Wind, keys: ['flow']},
  {n: 7, id: 'direction', title: 'Flow direction', icon: Fan, keys: ['direction']},
  {n: 8, id: 'ignition', title: 'Ignition', icon: Zap, keys: ['power', 'duration']},
  {n: 9, id: 'temp', title: 'Initial temperature', icon: Thermometer, keys: ['temp']},
  {n: 10, id: 'suppression', title: 'Suppression', icon: ShieldAlert, keys: ['agent', 'conc', 'discharge']}
];
const CAMS = [['hero', Video, 'Hero · 0'], ['flame', Flame, 'Flame close-up · 1'], ['side', RectangleHorizontal, 'Side · 3'], ['top', ArrowDownToLine, 'Top · 7'], ['low', ArrowUpFromLine, 'Low angle'], ['inlet', Fan, 'Inlet fan'], ['wide', Orbit, 'Wide · module']];
const OUTLINER = [['Module', 0, 'LAB-02 module'], ['Space', 1, 'Earth · stars'], ['FlowDuct', 0, 'Flow duct'], ['Sample', 1, 'Sample card'], ['Flame', 1, 'Flame volume'], ['Airflow', 1, 'Tracers · streamlines'], ['Soot', 1, 'Soot · embers'], ['Suppression', 1, 'Agent spray']];

const fmt = (k, v) => { const f = FIELDS[k]; return f ? Number(v).toFixed(f.dec) : String(v); };
const nearestG = g => GRAVITY.reduce((a, b) => Math.abs(b.g - g) < Math.abs(a.g - g) ? b : a);

function fromScenario(s, base) {
  const p = {...base};
  if (s?.material) p.material = s.material;
  if (s?.oxygen && !Number.isNaN(Number(s.oxygen))) p.oxygen = Number(s.oxygen);
  if (s?.airflow && !Number.isNaN(Number(s.airflow))) p.flow = Number(s.airflow);
  if (s?.geometry && !Number.isNaN(Number(s.geometry))) p.width = Number(s.geometry) * 10;
  return p;
}

/* ---------------------------------------------------------------- fields */
export function NumField({k, value, onChange, ks}) {
  const f = FIELDS[k];
  const [edit, setEdit] = useState(false);
  const drag = useRef(null);
  const pct = (value - f.min) / (f.max - f.min) * 100;
  const set = v => onChange(k, Math.min(f.max, Math.max(f.min, Math.round(v / f.step) * f.step)));
  // throttle: pointermove fires far faster than React/Three.js need to react
  // to — coalesce drag updates to once per animation frame instead of once
  // per raw pointer event, so dragging a slider doesn't flood setParams.
  const throttledSet = useRef(rafThrottle(set));
  if (edit) return <input className="bf-input" autoFocus defaultValue={fmt(k, value)} onBlur={e => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) set(v); setEdit(false); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEdit(false); }}/>;
  return <div className={`bf ${ks || ''}`} role="slider" tabIndex={0} aria-label={f.label} aria-valuemin={f.min} aria-valuemax={f.max} aria-valuenow={value}
    onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(value + f.step * 10); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(value - f.step * 10); } if (e.key === 'Enter') setEdit(true); }}
    onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = {x: e.clientX, v: value, w: e.currentTarget.clientWidth, moved: false}; }}
    onPointerMove={e => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 2) d.moved = true; if (d.moved) throttledSet.current(d.v + dx / d.w * (f.max - f.min) * (e.shiftKey ? .1 : 1)); }}
    onPointerUp={() => { const d = drag.current; drag.current = null; if (d && !d.moved) setEdit(true); }}>
    <i className="bf-fill" style={{width: `${pct}%`}}/>
    <span className="bf-lab">{f.label}</span><span className="bf-val">{fmt(k, value)} <small>{f.unit}</small></span>
  </div>;
}
export function Enum({k, value, options, onChange, ks, label}) {
  return <label className={`be ${ks || ''}`}><span>{label}</span><select value={value} onChange={e => onChange(k, e.target.value)}>{options.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{t}</option>; })}</select><ChevronDown size={12}/></label>;
}
/* Parameter panel. Memoised so it only re-renders when its own inputs change
   (the parameter values or which section is open) — not on every frame-driven
   state update from the 3D scene, which is what made opening/closing lag. */
export const ParamPanel = memo(function ParamPanel({params, open, setOpen, change, onReignite, className = 'st-side'}) {
  const live = params;
  return <aside className={className}>
    <div className="pr-body">
      <div className="pr-title">Parameters <small>DRAG OR CLICK TO EDIT</small></div>
      {PANELS.map(p => <div key={p.id} data-panel={p.id} className={`pn ${open[p.id] ? '' : 'closed'}`}>
        <button className="pn-head" onClick={() => setOpen(o => ({...o, [p.id]: !o[p.id]}))} aria-expanded={!!open[p.id]}><em>{String(p.n).padStart(2, '0')}</em>{p.title}<ChevronDown size={13} className="pn-chevron"/></button>
        {open[p.id] && <div className="pn-body">{p.keys.map(k => {
          if (k === 'material') return <Enum key={k} k={k} label="Material" value={live.material} onChange={change} options={Object.entries(MATERIALS).map(([v, m]) => [v, `${m.short} · ${m.note}`])}/>;
          if (k === 'direction') return <Enum key={k} k={k} label="Direction" value={live.direction} onChange={change} options={DIRECTIONS}/>;
          if (k === 'agent') return <Enum key={k} k={k} label="Agent" value={live.agent} onChange={change} options={AGENTS}/>;
          if (k === 'discharge') return <button key={k} className={`bt ${live.discharge ? 'on' : ''}`} onClick={() => change('discharge', !live.discharge)} disabled={live.agent === 'None'}><i/>{live.discharge ? 'Discharging' : 'Discharge agent'}</button>;
          return <NumField key={k} k={k} value={live[k]} onChange={change}/>;
        })}
          {p.id === 'gravity' && <div className="pills">{GRAVITY.map(g => <button key={g.name} className={nearestG(live.g).name === g.name ? 'on' : ''} onClick={() => change('g', g.g)}>{g.name}</button>)}</div>}
          {p.id === 'ignition' && <button className="bt fire" onClick={() => onReignite?.()}><Zap size={12}/> Fire igniter</button>}
        </div>}
      </div>)}
    </div>
  </aside>;
});

/* ---------------------------------------------------------------- studio */
const Lab = forwardRef(function Lab({scenario, mode, onMode, reduced, onReduced, initialParams}, ref) {
  const root = useRef(null), host = useRef(null), world = useRef(null);
  const callouts = useRef({}), gizmo = useRef(null), spark = useRef(null), sparkData = useRef([]);
  const props = useRef(null), track = useRef(null);
  const [params, setParams] = useState(() => initialParams || fromScenario(scenario, DEFAULT_PARAMS));
  const [ui, setUi] = useState({d: null, fps: 60, igOK: 1, out: false});
  const [full, setFull] = useState(() => typeof location !== 'undefined' && location.hash.startsWith('#studio'));
  const [hud, setHud] = useState(true);
  const [side, setSide] = useState(true);
  const [tools, setTools] = useState(true);
  const [open, setOpen] = useState(() => Object.fromEntries(PANELS.map(p => [p.id, true])));
  const [vis, setVis] = useState(() => Object.fromEntries(OUTLINER.map(o => [o[0], true])));
  const [cam, setCam] = useState('hero');
  const [error, setError] = useState(false);
  // loading state: the overlay stays up until the chamber has rendered its first frames
  const [ready, setReady] = useState(false);
  const [loadMsg, setLoadMsg] = useState('Building the chamber…');
  const [pulseFull, setPulseFull] = useState(true);
  const [toast, setToast] = useState('in');
  useEffect(() => {
    const t1 = setTimeout(() => setToast('out'), 5000);
    const t2 = setTimeout(() => setToast(null), 5700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const live = params;

  /* world lifecycle — the three.js scene is loaded on demand here, so the
     parameter panel (and the rest of the page) render immediately while the
     chamber's bundle is fetched; only the canvas shows the cube loader. */
  useEffect(() => {
    let api = null, cancelled = false, tMsg = 0, tFail = 0;
    import('./labScene.js').then(({createLab}) => {
      if (cancelled) return;
      try { api = createLab(host.current, {params, mode, reduced}); } catch (e) { console.error(e); setError(true); return; }
      world.current = api;
      let last = 0, frames = 0, fpsT = performance.now(), fps = 60;
      // ready after a few real frames (shaders compiled and drawn); a timeout
      // guarantees the overlay can never stick on a slow device
      let rendered = 0, isReady = false;
      const markReady = () => { if (!isReady) { isReady = true; setReady(true); } };
      tMsg = window.setTimeout(() => setLoadMsg('Igniting the flame…'), 1200);
      tFail = window.setTimeout(markReady, 15000);
      api.state.onFrame = f => {
        rendered++; if (rendered >= 3) markReady();
        frames++; const now = performance.now();
        if (now - fpsT > 500) { fps = Math.round(frames * 1000 / (now - fpsT)); frames = 0; fpsT = now; }
        for (const key in f.anchors) { const el = callouts.current[key], a = f.anchors[key]; if (el) { el.style.transform = `translate(${a.x}px,${a.y}px)`; el.style.opacity = a.vis ? 1 : 0; } }
        drawGizmo(gizmo.current, f.quat);
        const sd = sparkData.current; sd.push(f.lum); if (sd.length > 160) sd.shift(); drawSpark(spark.current, sd);
        if (now - last > 45) { last = now; setUi({d: f.d, sm: f.sm, fps, igOK: f.igOK, out: f.out}); }
      };
    }).catch((e) => { console.error(e); setError(true); });
    return () => {
      cancelled = true;
      window.clearTimeout(tMsg); window.clearTimeout(tFail);
      if (api) api.dispose();
      world.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { const s = world.current?.state; if (s) { s.params = params; } }, [params]);
  useEffect(() => { const s = world.current?.state; if (s) s.mode = mode === 'Experiment setup' ? mode : 'Illustrative visualization'; }, [mode]);
  useEffect(() => { const s = world.current?.state; if (s) s.reduced = reduced; }, [reduced]);
  useEffect(() => { const o = world.current?.objects; if (!o) return; for (const k in vis) if (o[k]) o[k].visible = vis[k]; }, [vis]);

  // follow the Define panel (evidence scenario) when it changes
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } pause(); setParams(p => fromScenario(scenario, p)); }, [scenario.material, scenario.oxygen, scenario.airflow, scenario.geometry]); // eslint-disable-line

  /* playback */
  const A = () => world.current?.state.anim;
  const pause = useCallback(() => {
    const a = A(); if (!a || !a.playing) return;
    a.playing = false;
  }, []);
  const resetLab = useCallback(() => {
    const next = {...DEFAULT_PARAMS};
    const a = A();
    if (a) { a.playing = false; a.t = 0; a.camera = true; }
    if (world.current?.state) world.current.state.params = next;
    setParams(next);
    setUi(u => ({...u}));
    world.current?.reignite();
    world.current?.fly('hero', 1.6);
    setCam('hero');
  }, []);
  useImperativeHandle(ref, () => ({
    pause,
    reset: resetLab
  }), [pause, resetLab]);
  const change = useCallback((k, v) => {
    setParams(p => ({...p, [k]: v}));
  }, []);
  const reigniteLab = useCallback(() => world.current?.reignite(), []);
  const toggleFull = useCallback(() => {
    setPulseFull(false);
    const el = root.current; if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (!full) { setFull(true); el.requestFullscreen?.().catch(() => {}); }
    else setFull(false);
  }, [full]);
  useEffect(() => { const h = () => { if (!document.fullscreenElement) setFull(f => location.hash.startsWith('#studio') ? f : false); }; document.addEventListener('fullscreenchange', h); return () => document.removeEventListener('fullscreenchange', h); }, []);
  const flyTo = name => { setCam(name); world.current?.fly(name, 2.2); };

  /* shortcuts (Blender-ish) */
  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input,select,textarea') || e.metaKey || e.ctrlKey) return;
      const r = root.current?.getBoundingClientRect(); if (!full && r && (r.bottom < 80 || r.top > innerHeight - 80)) return;
      const k = e.key.toLowerCase();
      if (k === 'f') toggleFull();
      else if (k === 'n') setSide(s => !s);
      else if (k === 't') setTools(s => !s);
      else if (k === 'h') setHud(s => !s);
      else if (k === 'r') world.current?.reignite();
      else if (k === '0') flyTo('hero'); else if (k === '1') flyTo('flame'); else if (k === '3') flyTo('side'); else if (k === '7') flyTo('top');
    };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [full, toggleFull]);

  return <div ref={root} className={`studio ${full ? 'is-full' : ''} ${side ? '' : 'no-side'} ${hud ? '' : 'no-hud'}`}>
    <div className="st-body">
      <div className="vp-canvas">
        <div className="vp-gl" ref={host} role="img" aria-label="Interactive 3D chamber. The flame and airflow are an illustrative visualization, not measured imagery or a validated simulation."/>
        {error && <div className="vp-empty">3D view unavailable on this device. The sourced evidence below remains accessible.</div>}
        {!ready && !error && <CubeLoader overlay message={loadMsg}/>}
        <div className="vp-overlay">
          {toast && <div className={`vp-toast ${toast === 'out' ? 'is-out' : ''}`}><span className="vp-hint-key"><Mouse size={13}/></span><span className="vp-toast-text"><span className="vp-toast-main">Okay, you can use your mouse to drag over and do things.</span><span className="vp-toast-sub">Illustrative simulation · not a CFD simulation</span></span></div>}
          <div className="vp-actions">
            <button className="st-iconbtn" title="Reset" onClick={resetLab}><RotateCcw size={15}/></button>
            <button className="st-iconbtn" title={side ? 'Hide parameters (N)' : 'Show parameters (N)'} onClick={() => setSide(v => !v)}>{side ? <ArrowRight size={15}/> : <ArrowLeft size={15}/>}</button>
            <button className={`st-iconbtn ${pulseFull && !full ? 'flash' : ''}`} title="Full screen (F)" onClick={toggleFull}>{full ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}</button>
          </div>
          {!error && <div className="vp-hint"><span className="vp-hint-key"><Mouse size={14}/></span><span className="vp-hint-text">Hover to look around</span></div>}
        </div>
      </div>

      <ParamPanel params={live} open={open} setOpen={setOpen} change={change} onReignite={reigniteLab}/>
    </div>
  </div>;
});

export default Lab;

/* ---------------------------------------------------------------- helpers */
const AX = [['X', [1, 0, 0], '#ff3653'], ['Y', [0, 0, -1], '#8adb00'], ['Z', [0, 1, 0], '#2c8fff']];
function drawGizmo(svg, q) {
  if (!svg || !q) return;
  // rotate world axes into view space: v' = q⁻¹ · v
  const [x, y, z, w] = [-q.x, -q.y, -q.z, q.w];
  const rot = v => { const t = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])]; return [v[0] + w * t[0] + (y * t[2] - z * t[1]), v[1] + w * t[1] + (z * t[0] - x * t[2]), v[2] + w * t[2] + (x * t[1] - y * t[0])]; };
  const items = [];
  for (const [n, v, c] of AX) { const r = rot(v); items.push({n, c, x: r[0] * 34, y: -r[1] * 34, z: r[2], pos: true}); items.push({n, c, x: -r[0] * 34, y: r[1] * 34, z: -r[2], pos: false}); }
  items.sort((a, b) => a.z - b.z);
  svg.innerHTML = `<circle r="48" fill="rgba(255,255,255,.04)"/>` + items.map(i => i.pos
    ? `<line x1="0" y1="0" x2="${i.x.toFixed(1)}" y2="${i.y.toFixed(1)}" stroke="${i.c}" stroke-width="2.4"/><circle cx="${i.x.toFixed(1)}" cy="${i.y.toFixed(1)}" r="9" fill="${i.c}"/><text x="${i.x.toFixed(1)}" y="${(i.y + 3.6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#0b0f16">${i.n}</text>`
    : `<circle cx="${i.x.toFixed(1)}" cy="${i.y.toFixed(1)}" r="8" fill="${i.c}" fill-opacity=".22" stroke="${i.c}" stroke-opacity=".7"/>`).join('');
}
function drawSpark(c, data) {
  if (!c) return; const g = c.getContext('2d'), w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(160,182,215,.12)'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
  if (data.length < 2) return;
  const grd = g.createLinearGradient(0, 0, w, 0); grd.addColorStop(0, 'rgba(115,210,226,.2)'); grd.addColorStop(1, 'rgba(255,172,94,1)');
  g.strokeStyle = grd; g.lineWidth = 1.6; g.beginPath();
  data.forEach((v, i) => { const x = i / 159 * w, y = h - 3 - Math.min(1, v / 1.4) * (h - 6); i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.stroke();
}
