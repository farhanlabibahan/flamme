// SI disclosure: written with Claude (Anthropic). Calls the SI endpoint in api/ask.js.
// Client for the SI layer (api/ask.js). Every function rejects on failure so
// callers can fall back to the deterministic path.
import {rankFindings, gapsFor} from './ranking.js';

async function post(body) {
  const r = await fetch('/api/ask', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
  if (!r.ok) throw Object.assign(new Error(`api ${r.status}`), {status: r.status});
  return r.json();
}

const num = v => { const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? String(n) : ''; };

export const siParse = async question => {
  const p = await post({mode: 'parse', question});
  return {
    material: p.material || '', oxygen: num(p.oxygen), airflow: num(p.airflow),
    direction: p.direction || '', pressure_atm: p.pressure_atm ?? null, gravity_g: p.gravity_g ?? null, in_scope: p.in_scope !== false,
  };
};

// Ranks findings for the scenario, sends only the top rows, then drops any
// citation the model made that was not among the rows it was given.
export async function siInterpret(question, parsed, scenario) {
  const sc = {
    o2_pct: Number(parsed.oxygen || scenario.oxygen) || 21,
    pressure_atm: parsed.pressure_atm ?? 1,
    gravity_g: parsed.gravity_g ?? 0,
  };
  const top = rankFindings(sc).slice(0, 5).map(r => r.f);
  const gaps = gapsFor(sc);
  const pick = f => ({finding_id: f.finding_id, psi_id: f.psi_id, experiment: f.experiment, material_or_fuel: f.material_or_fuel, condition: f.condition, gravity: f.gravity, metric: f.metric, value: f.value, unit: f.unit, n_tests: f.n_tests, finding: f.finding, safety_implication: f.safety_implication, caveat: f.caveat, confidence: f.confidence});
  const out = await post({mode: 'interpret', question, rows: top.map(pick), gaps: gaps.map(g => ({finding_id: g.finding_id, finding: g.finding}))});
  const ok = new Map(top.map(f => [f.finding_id, f]));
  const points = (out.points || []).map(p => ({text: String(p.text || ''), sources: (p.finding_ids || []).filter(id => ok.has(id)).map(id => ok.get(id))})).filter(p => p.text && p.sources.length);
  return {summary: String(out.summary || ''), points, limits: String(out.limits || ''), scenario: sc, detectorGap: gaps.some(g => g.finding_id === 'GAP-DETECTOR-RESPONSE')};
}

// Citation helpers: PSI findings link to their PSI page; report findings (no PSI id) link to NTRS.
const ntrsId = f => (String(f.source_file || '').match(/NTRS (\d+)/) || [])[1];
export const citeLabel = f => `${f.psi_id || (ntrsId(f) ? `NTRS ${ntrsId(f)}` : 'NASA report')} \u00b7 ${f.experiment}`;
export const citeUrl = f => f.psi_id ? `https://psi.nasa.gov/physci/repo/data/investigations/${f.psi_id}` : ntrsId(f) ? `https://ntrs.nasa.gov/citations/${ntrsId(f)}` : null;
