// SI disclosure: written with Claude (Anthropic).
/* JS port of findings/rank_findings.py. Same formula, same constants, so the
   in-browser ranking matches findings/rankings.csv for the preset scenarios.
   score = 100 x (wRel*Relevance + wSev*Severity + wEvi*Evidence) */
import data from './findingsData.json' with {type: 'json'};

export const {findings, scenarios} = data;
export const DEFAULT_WEIGHTS = {rel: 0.45, sev: 0.35, evi: 0.20};
const CONF = {high: 1.0, medium: 0.7, low: 0.4};
const TYPE = {measured_outcome: 1.0, report_extracted: 1.0, test_coverage: 0.4};

export function rangeMatch(lo, hi, target, penalty, unknown = 0.6) {
  if (lo == null && hi == null) return unknown;
  lo = lo ?? hi; hi = hi ?? lo;
  const dist = Math.max(0, lo - target, target - hi);
  return Math.max(0, 1 - dist * penalty);
}
export function gravityLevels(text) {
  const t = (text || '').toLowerCase(), g = [];
  if (['microgravity', 'drop tower', 'low-g', 'low gravity'].some(k => t.includes(k))) g.push(0);
  if (t.includes('1-g') || t.includes('1g')) g.push(1);
  if (t.includes('partial')) g.push(0.3);
  return g;
}
export function gravityMatch(text, target) {
  const g = gravityLevels(text);
  return g.length ? Math.max(...g.map(x => 1 - Math.abs(target - x))) : 0.6;
}
export function scoreFinding(f, sc, w = DEFAULT_WEIGHTS) {
  const o2 = rangeMatch(f.o2_pct_min, f.o2_pct_max, sc.o2_pct, 0.1);
  const pr = rangeMatch(f.pressure_atm_min, f.pressure_atm_max, sc.pressure_atm, 2.0);
  const gr = gravityMatch(f.gravity, sc.gravity_g);
  const rel = 0.40 * o2 + 0.25 * pr + 0.35 * gr;
  const sev = f.severity / 3;
  const evi = (CONF[f.confidence] ?? 0.4) * (TYPE[f.evidence_type] ?? 0.4);
  const total = w.rel + w.sev + w.evi || 1;
  return {f, score: Math.round(1000 * (w.rel * rel + w.sev * sev + w.evi * evi) / total * 100 / 100) / 10, o2, pr, gr, rel, sev, evi};
}
export function rankFindings(sc, w = DEFAULT_WEIGHTS) {
  return findings.filter(f => f.evidence_type !== 'evidence_gap')
    .map(f => scoreFinding(f, sc, w)).sort((a, b) => b.score - a.score);
}
export function gapsFor(sc) {
  return findings.filter(f => f.evidence_type === 'evidence_gap').filter(f => {
    if (f.finding_id === 'GAP-PARTIAL-G') return sc.gravity_g > 0;
    if (f.finding_id === 'GAP-EXPLORATION-SOLIDS') return sc.o2_pct > 25 || sc.pressure_atm < 0.8;
    return true;
  });
}

const CSV_COLS = ['rank','score','finding_id','experiment','psi_id','theme','material_or_fuel','condition','o2_pct_min','o2_pct_max','pressure_atm_min','pressure_atm_max','flow_cm_s','gravity','metric','value','unit','n_tests','evidence_type','confidence','severity','finding','caveat','source_file','page'];
const esc = v => { const t = v == null ? '' : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
/* Modeling-ready export of a ranked list: one row per finding with numeric
   condition ranges kept separate from text, so it loads straight into pandas/R. */
export function exportRows(ranked) { return ranked.map((r, i) => ({rank: i + 1, score: r.score, ...r.f})); }
export function toCsv(rows) { return [CSV_COLS.join(','), ...rows.map(r => CSV_COLS.map(c => esc(r[c])).join(','))].join('\n'); }

/* "Controls & equipment": which kind of spacecraft fire-safety hardware or procedure a finding informs.
   Derived from the finding's own text (finding + safety_implication) with these fixed patterns, so
   the filter on /rankings is reproducible. A finding can carry more than one tag. */
export const CONTROL_PATTERNS = {
  'Detection': /detector|alarm|smoke properties|sensing|sensors?\b|gas monitoring|monitoring/i,
  'Suppression': /suppress|inerting|inert-gas|(?<!self-)extinguisher|(?<!self-)extinguishing|backup/i,
  'Ventilation & airflow': /ventilation|\bfans?\b|airflow|low-fan|fans-down|venting/i,
  'Atmosphere & life support': /scrubb|masks|oxygen storage|oxygen generators|cabin oxygen|oxygen to ~/i,
};
export const controlTags = f => {
  const t = `${f.finding} ${f.safety_implication}`;
  return Object.entries(CONTROL_PATTERNS).filter(([, re]) => re.test(t)).map(([k]) => k);
};
