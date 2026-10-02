#!/usr/bin/env python3
"""Convert hand-extracted report findings (_report_rows.jsonl) into findings_reports.csv,
same columns as findings_tables.csv plus page + quote. Then run merge_findings.py."""
import csv, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
cols = next(csv.reader(open(os.path.join(HERE, "findings_tables.csv"), encoding="utf-8"))) + ["page", "quote"]
titles = {r["ntrs_id"]: r for r in csv.DictReader(open(os.path.join(HERE, "..", "flame_in_freefall_data", "ntrs_reports.csv"), encoding="utf-8"))}
rows, count = [], {}
for line in open(os.path.join(HERE, "_report_rows.jsonl"), encoding="utf-8"):
    if not line.strip(): continue
    j = json.loads(line)
    count[j["src"]] = count.get(j["src"], 0) + 1
    t = titles.get(j["src"], {})
    rows.append({
        "finding_id": f"RPT-{j['src']}-{count[j['src']]}", "question": j["q"], "theme": j["theme"],
        "psi_id": "", "experiment": j["exp"], "material_or_fuel": j["mat"], "condition": j["cond"],
        "o2_pct_min": j["o2min"], "o2_pct_max": j["o2max"], "pressure_atm_min": j["pmin"], "pressure_atm_max": j["pmax"],
        "flow_cm_s": j["flow"], "gravity": j["g"], "metric": j["metric"], "value": j["value"], "unit": j["unit"],
        "n_tests": j["n"], "finding": j["finding"], "safety_implication": j["impl"],
        "evidence_type": "report_extracted", "confidence": j["conf"],
        "source_file": f"NTRS {j['src']} - {t.get('title','')} ({t.get('year','')}) {t.get('pdf_url','')}",
        "caveat": "Extracted from the NASA report by reading it; check the quote on the cited page.",
        "page": j["page"], "quote": j["quote"],
    })
with open(os.path.join(HERE, "findings_reports.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=cols); w.writeheader(); w.writerows(rows)
print(f"{len(rows)} report findings from {len(count)} reports -> findings_reports.csv")
