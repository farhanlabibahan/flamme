# Findings table (step 2)

`findings.csv` is the dashboard's single data source. **One row = one finding.**

| Script | What it does |
|---|---|
| `build_findings.py` | Computes findings from the 22 PSI test tables -> `findings_tables.csv` (no API key needed) |
| `extract_findings_from_pdfs.py` | Optional (needs API credits): Claude API pulls more findings from PDFs -> `findings_ai.csv` |
| `_report_rows.jsonl` + `report_rows_to_csv.py` | 52 findings read by hand (by Claude) from 18 NASA reports, with page + quote -> `findings_reports.csv` |
| `merge_findings.py` | Combines both -> `findings.csv` |
| `rank_findings.py` + `scenarios.json` | Step 3: scores every finding for ISS / transit / Moon / Mars -> `rankings.csv` (method: `RANKING_METHOD.md`) |

```bash
python3 findings/build_findings.py
python3 findings/report_rows_to_csv.py
python3 findings/merge_findings.py
# optional, needs API credits - would ADD AI-extracted rows:
# after downloading PDFs and setting ANTHROPIC_API_KEY:
python3 findings/extract_findings_from_pdfs.py --limit 3   # test first
python3 findings/extract_findings_from_pdfs.py
python3 findings/merge_findings.py
```

## Columns
- `question` - Q1 materials / Q2 fire growth / Q3 suppression / Q4 detection / Q5 flame regimes
- `theme`, `psi_id`, `experiment`, `material_or_fuel`
- conditions: `condition`, `o2_pct_min/max`, `pressure_atm_min/max`, `flow_cm_s`, `gravity`
- result: `metric`, `value`, `unit`, `n_tests`
- `finding` (plain English), `safety_implication`
- `evidence_type`: `measured_outcome` | `test_coverage` (what was tested, outcome in reports) | `evidence_gap` | `report_extracted`
- `confidence`: high (>=10 tests) / medium (4-9) / low (<4 or unclear meaning)
- `source_file`, `caveat` (+ `page`, `quote` for report rows)

Report-extracted rows are AI-generated: check the quoted page before showing them as fact.
