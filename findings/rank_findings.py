#!/usr/bin/env python3
"""
rank_findings.py - Step 3: score and rank every finding for each mission scenario.

    score (0-100) = 100 * (0.45 * Relevance + 0.35 * Severity + 0.20 * Evidence)

Relevance  = how closely the test conditions match the mission
             0.40 * oxygen match   (1 inside the tested O2 range, -0.1 per %-point outside; unknown = 0.6)
           + 0.25 * pressure match (1 inside the tested range, -0.2 per 0.1 atm outside; unknown = 0.6)
           + 0.35 * gravity match  (1 - |mission g - test g|; a microgravity-vs-1g comparison uses the closer one)
Severity   = hazard importance for crew safety, 1-3 (see SEVERITY below) / 3
Evidence   = confidence (high 1.0 / medium 0.7 / low 0.4) x type (measured or report result 1.0, test coverage only 0.4)

Evidence gaps are not scored; they are listed per scenario when they apply.
Output: findings/rankings.csv  (one row per scenario x finding, with rank and each component)
"""
import csv, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
W_REL, W_SEV, W_EVI = 0.45, 0.35, 0.20

# 3 = direct crew threat or removes a safety margin; 1 = background / method / unclear meaning; default 2
SEVERITY = {
    3: ["FLEX-O2-HEPT-30", "FLEX-O2-METH-30", "FLEX-CO2-HEPT-HIO2", "FLEX-CO2-METH-HIO2", "CFIG-COOLFLAME",
        "SAF2-2-5", "SAF2-2-6", "BASS2-CO-MAX",
        "RPT-20240002981-2", "RPT-20240002981-3", "RPT-20240002981-4", "RPT-20240002981-5",
        "RPT-20210017780-1", "RPT-20210017780-2", "RPT-20210017780-4",
        "RPT-20260001992-4", "RPT-20260001992-5", "RPT-20180005168-2",
        "RPT-20210011385-1", "RPT-20210011385-2", "RPT-20210011385-4", "RPT-20210011385-8",
        "RPT-20210021781-1", "RPT-20210021781-5", "RPT-20220002714-2", "RPT-19930015566-1",
        "RPT-20040053527-1", "RPT-20150010172-1"],
    1: ["FLEX-BURNRATE-HEPT", "FLEX-BURNRATE-METH", "SAMER-KAPTON", "SAMER-LAMPWICK", "SAMER-PYRELL",
        "SAMER-SILICONE", "SAMER-TEFLON", "RPT-20150023456-1", "RPT-20210021781-6", "RPT-20070031686-1"],
}
SEV = {fid: s for s, ids in SEVERITY.items() for fid in ids}
CONF = {"high": 1.0, "medium": 0.7, "low": 0.4}
TYPE = {"measured_outcome": 1.0, "report_extracted": 1.0, "test_coverage": 0.4}

def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None

def range_match(lo, hi, target, per_unit_penalty, unknown=0.6):
    lo, hi = num(lo), num(hi)
    if lo is None and hi is None: return unknown
    lo = lo if lo is not None else hi; hi = hi if hi is not None else lo
    dist = max(0.0, lo - target, target - hi)
    return max(0.0, 1.0 - dist * per_unit_penalty)

def gravity_levels(text):
    t = (text or "").lower()
    g = []
    if any(k in t for k in ("microgravity", "drop tower", "low-g", "low gravity")): g.append(0.0)
    if "1-g" in t or "1g" in t: g.append(1.0)
    if "partial" in t: g.append(0.3)
    return g

def gravity_match(text, target):
    g = gravity_levels(text)
    return max(1 - abs(target - x) for x in g) if g else 0.6

def score(f, sc):
    o2 = range_match(f["o2_pct_min"], f["o2_pct_max"], sc["o2_pct"], 0.1)
    pr = range_match(f["pressure_atm_min"], f["pressure_atm_max"], sc["pressure_atm"], 2.0)
    gr = gravity_match(f["gravity"], sc["gravity_g"])
    rel = 0.40 * o2 + 0.25 * pr + 0.35 * gr
    sev = SEV.get(f["finding_id"], 2) / 3
    evi = CONF.get(f["confidence"], 0.4) * TYPE.get(f["evidence_type"], 0.4)
    return round(100 * (W_REL * rel + W_SEV * sev + W_EVI * evi), 1), o2, pr, gr, rel, sev, evi

def gap_applies(fid, sc):
    if fid == "GAP-PARTIAL-G": return sc["gravity_g"] > 0
    if fid == "GAP-EXPLORATION-SOLIDS": return sc["o2_pct"] > 25 or sc["pressure_atm"] < 0.8
    return True

def main():
    scen = {k: v for k, v in json.load(open(os.path.join(HERE, "scenarios.json"))).items() if not k.startswith("_")}
    finds = list(csv.DictReader(open(os.path.join(HERE, "findings.csv"), encoding="utf-8")))
    out = []
    for key, sc in scen.items():
        scored = []
        for f in finds:
            if f["evidence_type"] == "evidence_gap": continue
            s, o2, pr, gr, rel, sev, evi = score(f, sc)
            scored.append((s, f, o2, pr, gr, rel, sev, evi))
        scored.sort(key=lambda x: -x[0])
        for rank, (s, f, o2, pr, gr, rel, sev, evi) in enumerate(scored, 1):
            out.append({"scenario": key, "scenario_label": sc["label"], "rank": rank, "score": s,
                        "finding_id": f["finding_id"], "question": f["question"][:2], "finding": f["finding"],
                        "safety_implication": f["safety_implication"], "relevance": round(rel, 2),
                        "o2_match": round(o2, 2), "pressure_match": round(pr, 2), "gravity_match": round(gr, 2),
                        "severity": round(sev * 3), "evidence": round(evi, 2), "source_file": f["source_file"],
                        "page": f.get("page", "")})
        for f in finds:
            if f["evidence_type"] == "evidence_gap" and gap_applies(f["finding_id"], sc):
                out.append({"scenario": key, "scenario_label": sc["label"], "rank": "GAP", "score": "",
                            "finding_id": f["finding_id"], "question": f["question"][:2], "finding": f["finding"],
                            "safety_implication": f["safety_implication"]})
    cols = list(out[0].keys())
    with open(os.path.join(HERE, "rankings.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols); w.writeheader(); w.writerows(out)
    for key, sc in scen.items():
        print(f"\n=== {sc['label']}")
        for r in [r for r in out if r["scenario"] == key][:10]:
            print(f"{r['rank']:>3} {r['score']:>5}  {r['finding_id']:22} {r['finding'][:80]}")
        print("   gaps:", ", ".join(r["finding_id"] for r in out if r["scenario"] == key and r["rank"] == "GAP"))
    print(f"\n-> {os.path.join(HERE, 'rankings.csv')}")

if __name__ == "__main__":
    main()
