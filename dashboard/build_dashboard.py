#!/usr/bin/env python3
"""
build_dashboard.py - Step 4: pack findings.csv + scenarios + ranking rules into the dashboard.

    python3 dashboard/build_dashboard.py

Reads   findings/findings.csv, findings/scenarios.json, findings/rank_findings.py (severity map)
Writes  dashboard/index.html     - open in any browser, works offline (AI answers fall back to search)
        dashboard/artifact.html  - same page without the <html>/<head> wrapper, for publishing on claude.ai
Re-run it whenever findings.csv changes.
"""
import csv, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "findings"))
from rank_findings import SEV  # noqa: E402  (same severity ratings as the Python ranking)

QUESTIONS = {
    "Q1": ["Materials", "Which materials burn most easily, including in exploration atmospheres?"],
    "Q2": ["Fire growth", "How big and how fast does a spacecraft fire get, and what does it do to cabin air?"],
    "Q3": ["Suppression", "What puts a microgravity fire out?"],
    "Q4": ["Detection", "Can detectors catch a microgravity fire early?"],
    "Q5": ["Flame behaviour", "When do flames self-extinguish, go sooty, or turn into cool flames?"],
}


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def source(r):
    sf = r["source_file"]
    if sf.startswith("NTRS "):
        nid = sf.split()[1]
        title = sf.split(" - ", 1)[1].rsplit(" (", 1)[0] if " - " in sf else ""
        year = sf.rsplit("(", 1)[1].split(")")[0] if "(" in sf else ""
        return f"NASA report {nid}" + (f" ({year})" if year else ""), title, f"https://ntrs.nasa.gov/citations/{nid}"
    if r["psi_id"]:
        return f"{r['psi_id']} test table", sf, f"https://psi.nasa.gov/physci/repo/data/investigations/{r['psi_id']}"
    return "Dataset review", "", ""


def main():
    rows = list(csv.DictReader(open(os.path.join(ROOT, "findings", "findings.csv"), encoding="utf-8")))
    scen = {k: v for k, v in json.load(open(os.path.join(ROOT, "findings", "scenarios.json"))).items()
            if not k.startswith("_")}
    finds = []
    for r in rows:
        label, title, link = source(r)
        finds.append({
            "id": r["finding_id"], "q": r["question"][:2], "theme": r["theme"], "exp": r["experiment"],
            "mat": r["material_or_fuel"], "cond": r["condition"],
            "o2min": num(r["o2_pct_min"]), "o2max": num(r["o2_pct_max"]),
            "pmin": num(r["pressure_atm_min"]), "pmax": num(r["pressure_atm_max"]),
            "flow": r["flow_cm_s"], "g": r["gravity"], "metric": r["metric"], "value": r["value"],
            "unit": r["unit"], "n": r["n_tests"], "finding": r["finding"], "impl": r["safety_implication"],
            "type": r["evidence_type"], "conf": r["confidence"], "caveat": r["caveat"],
            "page": r.get("page", ""), "quote": r.get("quote", ""),
            "sev": SEV.get(r["finding_id"], 2), "src": label, "srcTitle": title, "link": link,
        })

    by_id = {f["id"]: f for f in finds}

    def flex(fuel):
        pts = []
        for f in finds:
            if f["id"].startswith(f"FLEX-O2-{fuel}"):
                pts.append({"x": (f["o2min"] + f["o2max"]) / 2, "lo": f["o2min"], "hi": f["o2max"],
                            "y": num(f["value"]), "n": int(f["n"]), "id": f["id"]})
        return sorted(pts, key=lambda p: p["x"])

    # Saffire IV-VI per-test results, NASA report 20260001992 Table 1 (page 6)
    saffire = [
        {"test": "IV-2", "mat": "PMMA", "desc": "Acrylic, 2-sided", "o2": 22, "kpa": 100.0, "alarm": 1083, "co": 110, "coAlarm": 63.2},
        {"test": "V-3", "mat": "PMMA", "desc": "Acrylic, 1-sided", "o2": 26, "kpa": 74.5, "alarm": 1117, "co": 55.5, "coAlarm": 28.1},
        {"test": "VI-3", "mat": "PMMA", "desc": "Acrylic, 2-sided", "o2": 30, "kpa": 54.4, "alarm": 1037, "co": 338, "coAlarm": 105},
        {"test": "VI-4", "mat": "PMMA", "desc": "Acrylic, 1-sided", "o2": 29, "kpa": 55.0, "alarm": 1603, "co": 309, "coAlarm": 283},
        {"test": "IV-1", "mat": "Fabric", "desc": "Cotton/fiberglass", "o2": 23, "kpa": 98.0, "alarm": 92, "co": 77.4, "coAlarm": 7.9},
        {"test": "V-2", "mat": "Fabric", "desc": "Cotton jersey", "o2": 28, "kpa": 74.1, "alarm": 146, "co": 74.3, "coAlarm": 11.9},
        {"test": "VI-2", "mat": "Fabric", "desc": "Cotton/fiberglass", "o2": 31, "kpa": 54.1, "alarm": 201, "co": 122, "coAlarm": 57.1},
    ]
    min_o2 = [
        {"label": "Acrylic rod keeps burning", "orbit": 13.5, "earth": 15.4, "id": "RPT-20210011385-1"},
        {"label": "Flame spreads along acrylic rod", "orbit": 17.5, "earth": 19.0, "id": "RPT-20210011385-2"},
    ]
    data = {
        "scenarios": scen, "questions": QUESTIONS, "findings": finds,
        "charts": {"flex": {"Heptane": flex("HEPT"), "Methanol": flex("METH")}, "saffire": saffire, "minO2": min_o2},
        "meta": {"n": len(finds), "reports": len({f["src"] for f in finds if f["type"] == "report_extracted"}),
                 "tables": len({f["src"] for f in finds if f["type"] != "report_extracted" and f["src"] != "Dataset review"})},
    }
    assert all(k in by_id for k in ("RPT-20210011385-1", "RPT-20260001992-4"))

    tpl = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
    page = tpl.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))
    open(os.path.join(HERE, "artifact.html"), "w", encoding="utf-8").write(page)
    full = ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>html,body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style></head><body>\n'
            + page + "\n</body></html>\n")
    open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(full)
    print(f"{len(finds)} findings -> dashboard/index.html ({len(full)//1024} KB) and dashboard/artifact.html")


if __name__ == "__main__":
    main()
