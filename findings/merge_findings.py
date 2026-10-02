#!/usr/bin/env python3
"""Merge table- and report-derived findings into findings/findings.csv (the dashboard's single data source)."""
import csv, os
HERE = os.path.dirname(os.path.abspath(__file__))
rows, cols = [], []
for name in ("findings_tables.csv", "findings_reports.csv", "findings_ai.csv"):
    p = os.path.join(HERE, name)
    if not os.path.exists(p): continue
    with open(p, encoding="utf-8") as fh:
        r = csv.DictReader(fh)
        cols += [c for c in r.fieldnames if c not in cols]
        rows += list(r)
QMAP = {"Q1": "Which materials burn most easily (incl. exploration atmospheres)?",
        "Q2": "How big / fast does a spacecraft fire get, and what does it do to cabin air?",
        "Q3": "What puts a microgravity fire out?",
        "Q4": "Can detectors catch a microgravity fire early?",
        "Q5": "When do flames self-extinguish, go sooty, or turn into cool flames?"}
for r in rows:   # normalise "Q3" -> "Q3: ..." so both sources match
    q = (r.get("question") or "").strip()[:2]
    if q in QMAP: r["question"] = f"{q}: {QMAP[q]}"
with open(os.path.join(HERE, "findings.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=cols); w.writeheader(); w.writerows(rows)
print(f"{len(rows)} findings -> findings/findings.csv")
