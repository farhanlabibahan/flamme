// Qualitative response model + keyframed timeline for the 3D chamber.
// ILLUSTRATIVE ONLY: the curves encode well-known *directions* of change
// (less forced flow in microgravity starves the flame, more O2 makes it hotter
// and sootier, gravity adds buoyant flow and flicker, thicker fuel spreads
// slower, too little ignition energy fails to ignite, inert agents dilute O2).
// They are not fitted to NASA data and must never be read as predictions.

export const SIBAL = 'Cotton–fiberglass (SIBAL)';

export const MATERIALS = {
  [SIBAL]: {short: 'SIBAL', note: 'Cotton–fiberglass fabric', k: 1, soot: .95, virgin: [0.86, 0.74, 0.56], ash: 0, weave: 1, ign: 1},
  PMMA: {short: 'PMMA', note: 'Acrylic sheet', k: 1.12, soot: .62, virgin: [0.62, 0.78, 0.86], ash: 0, weave: 0, ign: 1.5},
  Silicone: {short: 'SILICONE', note: 'Silicone sheet', k: .3, soot: .28, virgin: [0.6, 0.65, 0.7], ash: 1, weave: 0, ign: 2.2}
};
export const AGENTS = ['None', 'CO₂', 'N₂', 'Water mist'];
export const DIRECTIONS = ['Concurrent', 'Opposed'];
export const GRAVITY = [
  {g: 0, label: 'µg', name: 'ORBIT'},
  {g: .165, label: '0.17 g', name: 'MOON'},
  {g: .38, label: '0.38 g', name: 'MARS'},
  {g: 1, label: '1 g', name: 'EARTH'}
];

// numeric fields: [min, max, step, unit]
export const FIELDS = {
  length: {min: 100, max: 340, step: 1, unit: 'mm', label: 'Length', dec: 0},
  width: {min: 10, max: 100, step: 1, unit: 'mm', label: 'Width', dec: 0},
  thickness: {min: .05, max: 3, step: .01, unit: 'mm', label: 'Thickness', dec: 2},
  g: {min: 0, max: 1, step: .005, unit: 'g', label: 'g level', dec: 3},
  oxygen: {min: 15, max: 40, step: .1, unit: '% O₂', label: 'Oxygen', dec: 1},
  pressure: {min: 30, max: 101.3, step: .1, unit: 'kPa', label: 'Pressure', dec: 1},
  flow: {min: 0, max: 40, step: .1, unit: 'cm/s', label: 'Velocity', dec: 1},
  power: {min: 10, max: 150, step: 1, unit: 'W', label: 'Power', dec: 0},
  duration: {min: 1, max: 20, step: .1, unit: 's', label: 'Duration', dec: 1},
  temp: {min: -20, max: 150, step: 1, unit: '°C', label: 'Temperature', dec: 0},
  conc: {min: 0, max: 50, step: .5, unit: '%', label: 'Concentration', dec: 1}
};

export const DEFAULT_PARAMS = {
  material: SIBAL, length: 290, width: 50, thickness: .3,
  g: 0, oxygen: 21, pressure: 101.3, flow: 20, direction: 'Concurrent',
  power: 80, duration: 9.2, temp: 22, agent: 'None', conc: 0, discharge: false
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function derive(p) {
  const m = MATERIALS[p.material] || MATERIALS[SIBAL];
  const inert = p.discharge && (p.agent === 'CO₂' || p.agent === 'N₂') ? p.conc / 100 : 0;
  const mist = p.discharge && p.agent === 'Water mist' ? p.conc / 50 : 0;
  const o2 = p.oxygen * (1 - inert);                           // diluted oxygen
  const induced = 30 * Math.sqrt(Math.max(p.g, 0));            // buoyancy-induced inflow (illustrative)
  const V = Math.hypot(p.flow, induced);
  const o = clamp((o2 - 15) / 6, 0, 4.2);                      // 0 at 15 % O2, 1 at 21 %
  const pr = Math.pow(clamp(p.pressure, 10, 120) / 101.3, .5);
  const pre = clamp(1 + (p.temp - 20) / 260, .7, 1.6);          // preheating
  const thick = clamp(p.thickness, .02, 5);
  const edge = .65 + .35 * smooth(8, 50, p.width);              // narrow strips lose heat at edges
  const supply = smooth(.4, 7, V);
  const opposed = p.direction === 'Opposed';
  const power = clamp(m.k * o * pr * pre * edge * (1 - .95 * clamp(mist, 0, 1)), 0, 3);
  const energy = p.power * p.duration;
  const need = 230 * (.3 + thick) * m.ign / Math.max(.2, Math.min(o, 2) * pr * (pre * pre));
  const ign = smooth(.75, 1.15, energy / need);                // ignition success (latched at ignition)
  const alive = smooth(.12, .4, power * (.25 + .75 * supply));
  const intensity = alive * clamp(.45 + .55 * power, 0, 1.9) * (.3 + .7 * supply) * (.85 + .15 * Math.min(1, .6 / (.3 + thick)));
  let length = clamp((.9 + .1 * V) * (.4 + .6 * Math.min(o, 2)) * (.5 + .5 * m.k) * (.7 + .3 * pr) * pre, .3, 6) * (.2 + .8 * alive) * (.45 + .55 * supply);
  length *= Math.pow(.6 / (.3 + thick), .25);
  if (opposed) length = clamp(.28 + .35 * Math.min(o, 2) * (.6 + .4 * alive) - .004 * p.flow, .22, 1);
  const height = clamp((.24 + .5 / (1 + p.flow / 10)) * (.62 + .38 * Math.min(o, 1.8)), .16, 1) * (opposed ? .75 : 1);
  const soot = clamp(m.soot * (.2 + .55 * Math.min(o, 2.2)) * pr * smooth(1.5, 12, V), 0, 1.25) * (opposed ? .55 : 1);
  const spread = alive * .055 * (.5 + .5 * Math.min(o, 2)) * Math.sqrt(V / 20 + .05) * m.k * pre / Math.pow(.4 + thick * 1.2, .8) * (opposed ? .45 : 1);

  let regime, tone, note;
  if (alive < .3 && (inert || mist)) { regime = 'SUPPRESSED · EXTINCTION'; tone = 'cool'; note = `${p.agent} at ${p.conc}% overwhelms the flame (illustrative).`; }
  else if (alive < .3) { regime = 'NO SUSTAINED FLAME'; tone = 'none'; note = 'Below the illustrative threshold the flame cannot hold on.'; }
  else if (supply < .55) { regime = 'OXIDIZER-STARVED · NEAR QUENCH'; tone = 'warn'; note = 'With no buoyancy, oxygen only arrives with the forced flow.'; }
  else if (opposed) { regime = 'OPPOSED-FLOW SPREAD'; tone = 'ok'; note = 'The flame creeps upstream into the incoming air: short and slow.'; }
  else if (p.g >= .6) { regime = 'BUOYANT PLUME'; tone = 'hot'; note = 'Hot gas rises — flicker and upward lift dominate.'; }
  else if (p.g > .04) { regime = 'WEAK BUOYANCY'; tone = 'hot'; note = 'Partial gravity lifts the flame tail upward.'; }
  else { regime = 'CONCURRENT-FLOW SPREAD'; tone = 'ok'; note = 'A smooth, laminar flame sheet carried by the airflow.'; }

  // spherical-flame shape (illustrative): size from fuel size, O2, pressure; stretched by flow and buoyancy
  const size = Math.cbrt(clamp(p.length * p.width / (290 * 50), .1, 4));
  const radius = clamp(.62 * Math.pow(size, .5) * (.5 + .5 * Math.min(o, 2.2)) * Math.pow(pr, -.12) * Math.pow(pre, .3) * Math.pow(.6 / (.3 + thick), .12) * (.5 + .5 * supply) * edge, .12, 1.25);
  const elong = clamp(p.flow / 40, 0, 1) * (opposed ? .35 : 1);
  return {radius, elong, V, induced, supply, alive, intensity, length, height, soot, spread, ign, energy, need, o2,
    lift: p.g, flicker: smooth(.03, .7, p.g), regime, tone, note, ash: m.ash, weave: m.weave, virgin: m.virgin,
    dir: opposed ? -1 : 1, spray: p.discharge && p.agent !== 'None' ? clamp(p.conc / 30, .2, 1.3) : 0,
    agentIndex: AGENTS.indexOf(p.agent)};
}

export const level = v => v < .2 ? 'LOW' : v < .45 ? 'MODERATE' : v < .75 ? 'HIGH' : 'VERY HIGH';

/* ------------------------------------------------------------------ timeline */
export const FPS = 24;
export const END = 92;
// Each track: [time s, value]. Numeric values ease between keys; others step.
export const TRACKS = {
  flow: [[0, 20], [4, 20], [7.5, 3], [9, 3], [10, .5], [11.5, .5], [14.5, 32], [25, 32], [27.5, 20]],
  oxygen: [[0, 21], [16, 21], [19.5, 30], [21, 30], [24, 34], [26, 34], [28, 21]],
  pressure: [[0, 101.3], [21, 101.3], [24, 56.5], [26, 56.5], [28, 101.3]],
  thickness: [[0, .3], [29.5, .3], [32.5, 2], [34, 2], [35.5, .3]],
  width: [[0, 50], [35.5, 50], [37.5, 18], [39, 18], [40.5, 50]],
  g: [[0, 0], [41, 0], [43, .165], [44, .165], [46, .38], [47, .38], [49.5, 1], [52, 1], [54, 0]],
  direction: [[0, 'Concurrent'], [55, 'Opposed'], [61, 'Concurrent']],
  temp: [[0, 22], [62, 22], [64.5, 120], [65.5, 120], [67, 22]],
  power: [[0, 80], [68, 80], [68.6, 25], [72, 25], [72.6, 80]],
  duration: [[0, 9.2], [68, 9.2], [68.6, 3], [72, 3], [72.6, 9.2]],
  agent: [[0, 'None'], [76, 'CO₂'], [82, 'None']],
  conc: [[0, 0], [76, 0], [77.5, 30], [81.5, 30], [82, 0]],
  discharge: [[0, false], [78, true], [81.5, false]],
  material: [[0, SIBAL], [83, 'Silicone'], [88, SIBAL]],
  length: [[0, 290]]
};
export const EVENTS = [.05, 55.05, 61.05, 69.2, 73.2, 82.2, 83.2, 88.2]; // igniter firings
export const CAM_TRACK = [[0, 'hero'], [4, 'flame'], [12, 'side'], [16, 'hero'], [21, 'top'], [29.5, 'low'], [35.5, 'top'], [41, 'wide'], [48, 'low'], [54.5, 'flame'], [62, 'side'], [68, 'inlet'], [75, 'hero'], [83, 'flame'], [88, 'wide']];
export const CAPTIONS = [
  [0, 4, 'BASELINE', 'SIBAL fabric · 21% O₂ · 101 kPa · 20 cm/s concurrent flow · microgravity'],
  [4, 11.5, 'FORCED FLOW ↓', 'Without buoyancy, oxygen arrives only by flow and diffusion — the flame turns blue, then opens and fades'],
  [11.5, 16, 'FORCED FLOW ↑', 'More oxidizer delivered: the flame grows and stretches downstream'],
  [16, 21, 'OXYGEN ↑', 'Higher O₂ concentration — hotter, brighter, sootier flame'],
  [21, 29.5, 'PRESSURE ↓ · O₂ ↑', 'Exploration-style atmosphere: 56.5 kPa at 34% O₂ — oxygen partial pressure matters, not % alone'],
  [29.5, 35.5, 'GEOMETRY · THICKNESS', 'A thicker sample needs more heat to burn — the flame shrinks and dims'],
  [35.5, 41, 'GEOMETRY · WIDTH', 'Less exposed fuel and more edge heat loss — a smaller flame'],
  [41, 54, 'GRAVITY', 'Orbit → Moon → Mars → Earth: buoyancy lifts the plume and brings flicker'],
  [54, 61, 'FLOW DIRECTION', 'Opposed flow — the flame creeps into the incoming air: compact and slow'],
  [61, 68, 'INITIAL TEMPERATURE', 'Pre-heated surroundings — less energy needed, faster spread'],
  [68, 75, 'IGNITION', '25 W for 3 s delivers too little energy — no sustained flame. Nominal: 80 W · 9.2 s'],
  [75, 83, 'SUPPRESSION', 'CO₂ discharge at 30% dilutes the oxygen — the flame goes out'],
  [83, 88, 'MATERIAL', 'Silicone — Saffire II reports only an “Insignificant” burn-time entry'],
  [88, 92, 'ILLUSTRATIVE', 'Every response here is qualitative. The evidence lives in the NASA records.']
];

const ease = t => t * t * (3 - 2 * t);
export function valueAt(track, t) {
  if (!track?.length) return undefined;
  if (t <= track[0][0]) return track[0][1];
  for (let i = 1; i < track.length; i++) {
    const [t1, v1] = track[i], [t0, v0] = track[i - 1];
    if (t < t1) return typeof v0 === 'number' ? v0 + (v1 - v0) * ease((t - t0) / (t1 - t0)) : v0;
  }
  return track[track.length - 1][1];
}
export function paramsAt(t, base = DEFAULT_PARAMS) {
  const out = {...base};
  for (const k in TRACKS) out[k] = valueAt(TRACKS[k], t);
  return out;
}
// Is a track changing (or sitting on a key) at time t?
export function keyState(k, t) {
  const tr = TRACKS[k]; if (!tr || tr.length < 2) return null;
  const step = typeof tr[0][1] !== 'number';
  if (tr.some(([kt], i) => i > 0 && Math.abs(kt - t) < (step ? .6 : .12) && tr[i - 1][1] !== tr[i][1])) return 'key';
  if (!step) for (let i = 1; i < tr.length; i++) if (t > tr[i - 1][0] && t < tr[i][0] && tr[i - 1][1] !== tr[i][1]) return 'anim';
  return 'keyed';
}
export const captionAt = t => CAPTIONS.find(([a, b]) => t >= a && t < b);
