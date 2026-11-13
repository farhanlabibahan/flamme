#!/usr/bin/env python3
"""build_findings_data.py - pack findings.csv + scenarios.json into the web app's data files.

    python findings/build_findings_data.py

Reads   findings/findings.csv, findings/scenarios.json, findings/rank_findings.py (severity map),
        flame_in_freefall_data/ntrs_reports.csv
Writes  src/findingsData.json  (read by src/ranking.js; same severity as the Python ranking)
        src/reportsData.json   (read by the Sources page: every NTRS report a finding cites)
Re-run it after merge_findings.py whenever findings.csv, scenarios.json or ntrs_reports.csv changes.
"""
import csv, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from rank_findings import SEV  # noqa: E402

NUMERIC = ["o2_pct_min", "o2_pct_max", "pressure_atm_min", "pressure_atm_max"]


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def main():
    with open(os.path.join(HERE, "findings.csv"), encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    findings = []
    for r in rows:
        f = {k: v for k, v in r.items() if k not in NUMERIC}
        f.update({k: num(r[k]) for k in NUMERIC})
        f["severity"] = SEV.get(r["finding_id"], 2)
        findings.append(f)
    with open(os.path.join(HERE, "scenarios.json"), encoding="utf-8") as fh:
        scenarios = {k: v for k, v in json.load(fh).items() if not k.startswith("_")}
    out = os.path.join(HERE, "..", "src", "findingsData.json")
    with open(out, "w", encoding="utf-8", newline="") as fh:
        fh.write(json.dumps({"findings": findings, "scenarios": scenarios}, separators=(",", ":")))
    print(f"{len(findings)} findings -> src/findingsData.json")
    build_reports(rows)


def build_reports(rows):
    """Only reports that at least one finding actually cites, oldest first."""
    with open(os.path.join(HERE, "..", "flame_in_freefall_data", "ntrs_reports.csv"), encoding="utf-8") as fh:
        meta = {r["ntrs_id"]: r for r in csv.DictReader(fh)}
    cited = {}
    for r in rows:
        m = re.match(r"NTRS (\d+)", r["source_file"])
        if not m:
            continue
        c = cited.setdefault(m.group(1), {"findings": 0, "incident": False})
        c["findings"] += 1
        c["incident"] = c["incident"] or r["metric"] == "real-incident lesson"
    reports = []
    for nid, c in cited.items():
        t = meta[nid]  # KeyError here = a finding cites a report missing from ntrs_reports.csv
        reports.append({"id": nid, "title": t["title"], "year": t["year"], "topic": t["topic"],
                        "url": t["citation_url"], "findings": c["findings"], "incident": c["incident"]})
    reports.sort(key=lambda r: (r["year"], r["id"]))
    with open(os.path.join(HERE, "..", "src", "reportsData.json"), "w", encoding="utf-8", newline="") as fh:
        fh.write(json.dumps(reports, separators=(",", ":")))
    print(f"{len(reports)} cited NASA reports -> src/reportsData.json")


if __name__ == "__main__":
    main()
