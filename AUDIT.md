# Fire Navigator audit — 2026 prescreening prototype

Scope: `index.html`, Vite configuration, React UI, Three.js scene, source data model, ranking/explanation logic, tests, and bundled PSI-99/PSI-25 CSV rows. Checked against the challenge's evidence discovery, ranking, interpretation, and fire-safety context.

| Finding | Impact | Resolution |
|---|---|---|
| Flame was a tiny, nearly flat glow inside an oversized chamber | Weak demo visual | Rebuilt as layered, animated 3D plume volume and ribbons with orbit/zoom; adjusted lighting and scale. Still illustrative. |
| Scene implied a physics simulation | Scientific overclaim | Labelled “3D schematic”; disclaimer states it is not measured footage or validated prediction. |
| Demo steps changed text without a reliable visual destination | Prescreening flow failed | Steps now switch the correct workspace and scroll to related content; reset is deterministic. |
| Dense statistics, duplicated chrome, and inert controls | Cognitive overload | Rebuilt the layout with a focused scenario, a dominant lab, and progressive disclosure. |
| Pressure and Earth-gravity choices could not produce evidence matches | Misleading search | Removed from scenario controls; missing pressure and microgravity-only scope are disclosed. |
| `037 mm` was presented as a valid thickness | Data quality | Kept the original text, marked “verify,” and excluded it from normalization. |
| `2.1 mm/s` was labelled flame spread despite a conflicting CSV header | Data quality | Shown as a spread-column entry with an explicit header/unit caveat. |
| “Insignificant” received a seconds suffix | False precision | Display logic now preserves qualitative source values without fabricated units. |
| BASS II fan/air display could be mistaken for calibrated speed | Cross-study error | Airflow remains unreported; instrument-display limitation is documented. |
| Interpretation looked like a live AI answer | Capability overclaim | Labelled rule-based; README documents that no AI model is active. |
| Dead style layers obscured which rules controlled the UI | Maintenance risk | Replaced them with one `app.css`; removed unused CSS. |
| Source trace needed an obvious route | Trust/provenance | Drawer exposes investigation URL, DOI, CSV filename, and row number. |

## Remaining limits

This is a **concept prototype**, not a finished challenge solution. A validated physical flame simulation, measured media integration, a larger normalized corpus, actual grounded AI generation, and independent scientific review remain future work. The animation must never be presented as a NASA experimental reconstruction. The current ranking is simple and transparent, not a validated risk score.

## Verification

`npm test` checks ranking, missing values, qualitative units, ambiguity disclosures, and source row identity. `npm run build` verifies the production bundle. A local browser pass exercised demo progression, evidence source drawer, comparison view, and 3D rendering without browser console errors.
