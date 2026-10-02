#!/usr/bin/env python3
"""
build_findings.py - Step 2a: turn the 22 PSI test tables into ONE findings table.

Each row = one finding (a measured result, a test-coverage fact, or a known evidence gap),
tagged with the dashboard question it answers, its test conditions, evidence strength and source.

Run from the repo root or this folder:
    python3 findings/build_findings.py
Output: findings/findings_tables.csv
"""
import csv, io, os, re, statistics as st
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "flame_in_freefall_data", "psi_data")
OUT = os.path.join(HERE, "findings_tables.csv")

COLUMNS = [
    "finding_id", "question", "theme", "psi_id", "experiment", "material_or_fuel",
    "condition", "o2_pct_min", "o2_pct_max", "pressure_atm_min", "pressure_atm_max",
    "flow_cm_s", "gravity", "metric", "value", "unit", "n_tests",
    "finding", "safety_implication", "evidence_type", "confidence",
    "source_file", "caveat",
]
QUESTIONS = {
    "Q1": "Which materials burn most easily (incl. exploration atmospheres)?",
    "Q2": "How big / fast does a spacecraft fire get, and what does it do to cabin air?",
    "Q3": "What puts a microgravity fire out?",
    "Q4": "Can detectors catch a microgravity fire early?",
    "Q5": "When do flames self-extinguish, go sooty, or turn into cool flames?",
}

rows = []
def add(**kw):
    r = {c: "" for c in COLUMNS}
    r.update({k: ("" if v is None else v) for k, v in kw.items()})
    n = r.get("n_tests")
    if not r["confidence"]:
        n = int(n) if str(n).isdigit() else 0
        r["confidence"] = "high" if n >= 10 else "medium" if n >= 4 else "low"
    rows.append(r)

def table(psi, name_part):
    folder = os.path.join(DATA, psi, "Experimental table")
    fn = next(f for f in os.listdir(folder) if name_part in f and f.endswith(".csv"))
    raw = open(os.path.join(folder, fn), "rb").read()
    try:
        txt = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        txt = raw.decode("latin-1")          # FLEX table is Windows/Latin-1 encoded
    recs = [r for r in csv.DictReader(io.StringIO(txt)) if any((v or "").strip() for v in r.values())]
    return fn, [{(k or "").strip(): (v or "").strip() for k, v in r.items()} for r in recs]

def num(x):
    try:
        return float(re.sub(r"[^\d.\-]", "", str(x)) or "x")
    except ValueError:
        return None

def col(rec, startswith):
    return next(k for k in rec if k.startswith(startswith))

def pct(a, b):
    return round(100 * a / b) if b else 0

# ---------------------------------------------------------------- FLEX (PSI-69)
fn, flex = table("PSI-69", "FLEX")
O, C, H, P = (col(flex[0], s) for s in ("O initial", "CO initial", "He initial", "Ambient pressure"))
BR = col(flex[0], "Burning rate")
def diluent(r):
    if (num(r[C]) or 0) > 0: return "CO2"
    if (num(r[H]) or 0) > 0: return "He"
    return "N2"
def prange(sub):
    ps = [num(r[P]) / 760 for r in sub if num(r[P])]
    return (round(min(ps), 2), round(max(ps), 2)) if ps else ("", "")
bands = [("13-16% O2", 0.0, 0.165), ("17-20% O2", 0.165, 0.205), ("21% O2 (air)", 0.205, 0.215), ("30-34% O2", 0.25, 1.0)]
for fuel in ("Heptane", "Methanol"):
    for label, lo, hi in bands:
        sub = [r for r in flex if r["Fuel"] == fuel and diluent(r) == "N2" and lo < (num(r[O]) or 0) <= hi]
        if not sub: continue
        ext = sum(r["Test end"] == "Extinction" for r in sub)
        o2s = [num(r[O]) * 100 for r in sub]; pmin, pmax = prange(sub)
        label = "21% O2 (air)" if lo == 0.205 else f"{min(o2s):g}-{max(o2s):g}% O2"
        add(finding_id=f"FLEX-O2-{fuel[:4].upper()}-{int(min(o2s))}", question="Q3", theme="Droplet / liquid-fuel fires",
            psi_id="PSI-69", experiment="FLEX", material_or_fuel=fuel, condition=f"{label}, N2 balance, free droplet",
            o2_pct_min=round(min(o2s), 1), o2_pct_max=round(max(o2s), 1), pressure_atm_min=pmin, pressure_atm_max=pmax,
            flow_cm_s=0, gravity="microgravity (ISS)", metric="share of flames that self-extinguished before burnout",
            value=pct(ext, len(sub)), unit="%", n_tests=len(sub),
            finding=f"{fuel} droplet flames in {label}: {ext} of {len(sub)} went out on their own before the fuel was used up.",
            safety_implication=("Higher-oxygen cabin air makes liquid-fuel fires far less likely to self-extinguish."
                                if lo >= 0.25 else "Lowering oxygen is the most reliable way to make droplet flames go out."),
            evidence_type="measured_outcome", source_file=fn,
            caveat="'Extinction' = flame went out early; 'Disruption' = droplet broke up while still burning.")
for fuel in ("Heptane", "Methanol"):
    for label, lo, hi in [("O2 <= 18% with CO2", 0, 0.185), ("O2 >= 23% with CO2", 0.225, 1)]:
        sub = [r for r in flex if r["Fuel"] == fuel and diluent(r) == "CO2" and lo < num(r[O]) <= hi]
        if not sub: continue
        ext = sum(r["Test end"] == "Extinction" for r in sub)
        co2 = sorted({round(num(r[C]) * 100) for r in sub}); pmin, pmax = prange(sub)
        add(finding_id=f"FLEX-CO2-{fuel[:4].upper()}-{'LO' if hi < 0.2 else 'HI'}O2", question="Q3",
            theme="Droplet / liquid-fuel fires", psi_id="PSI-69", experiment="FLEX", material_or_fuel=fuel,
            condition=f"{label} ({co2[0]}-{co2[-1]}% CO2)", o2_pct_min=round(min(num(r[O]) for r in sub) * 100),
            o2_pct_max=round(max(num(r[O]) for r in sub) * 100), pressure_atm_min=pmin, pressure_atm_max=pmax,
            flow_cm_s=0, gravity="microgravity (ISS)", metric="share of flames that self-extinguished",
            value=pct(ext, len(sub)), unit="%", n_tests=len(sub),
            finding=f"{fuel} with CO2 added and {label.split(' with')[0]}: {ext} of {len(sub)} flames went out early.",
            safety_implication="CO2 only suppresses reliably when it also pulls oxygen down; at >=23% O2 it barely helps.",
            evidence_type="measured_outcome", source_file=fn)
for fuel in ("Heptane", "Methanol"):
    sub = [r for r in flex if r["Fuel"] == fuel and diluent(r) == "He"]
    ext = sum(r["Test end"] == "Extinction" for r in sub)
    add(finding_id=f"FLEX-HE-{fuel[:4].upper()}", question="Q3", theme="Droplet / liquid-fuel fires", psi_id="PSI-69",
        experiment="FLEX", material_or_fuel=fuel, condition="helium-diluted atmosphere",
        o2_pct_min=round(min(num(r[O]) for r in sub) * 100), o2_pct_max=round(max(num(r[O]) for r in sub) * 100),
        gravity="microgravity (ISS)", metric="share of flames that self-extinguished", value=pct(ext, len(sub)),
        unit="%", n_tests=len(sub), finding=f"{fuel} in helium mixtures: {ext} of {len(sub)} flames went out early.",
        safety_implication="Helium dilution is an effective suppressant for alcohol fuels; less so for heptane.",
        evidence_type="measured_outcome", source_file=fn)
for fuel in ("Heptane", "Methanol"):
    v = [num(r[BR]) for r in flex if r["Fuel"] == fuel and num(r[BR])]
    add(finding_id=f"FLEX-BURNRATE-{fuel[:4].upper()}", question="Q2", theme="Droplet / liquid-fuel fires",
        psi_id="PSI-69", experiment="FLEX", material_or_fuel=fuel, condition="all FLEX atmospheres",
        gravity="microgravity (ISS)", metric="mean droplet burning-rate constant", value=round(st.mean(v), 3),
        unit="mm^2/s (column labelled 'mm')", n_tests=len(v),
        finding=f"{fuel} droplets burned at an average burning-rate constant of {st.mean(v):.2f}.",
        safety_implication="Lets you estimate how long a spilled fuel droplet keeps burning in orbit.",
        evidence_type="measured_outcome", source_file=fn, caveat="Unit in source header is 'mm'; physically mm^2/s.")

# ---------------------------------------------------------------- CFI-G (PSI-159)
fn, cfig = table("PSI-159", "Normal")
SE = col(cfig[0], "Self-ext"); PB = col(cfig[0], "approx p")
lit = [r for r in cfig if r[SE] in ("SE", "FT")]
se = sum(r[SE] == "SE" for r in lit)
add(finding_id="CFIG-SELFEXT-ALL", question="Q5", theme="Gas flames / cool flames", psi_id="PSI-159",
    experiment="CFI-G", material_or_fuel="butane/propane/ethane blends", condition="normal gas-jet flames, all pressures",
    pressure_atm_min=0.5, pressure_atm_max=3.0, gravity="microgravity (ISS)",
    metric="share of lit flames that self-extinguished", value=pct(se, len(lit)), unit="%", n_tests=len(lit),
    finding=f"{se} of {len(lit)} lit gas flames went out on their own; the rest were stopped by the operator.",
    safety_implication="Small, quiescent gas flames often self-extinguish in microgravity, but not reliably.",
    evidence_type="measured_outcome", source_file=fn)
noign = sum(r["Hot ignition"] == "No" for r in cfig)
cool = [r for r in cfig if r.get("Cool flame?", "").lower().startswith("yes") or "cool" in r.get("Comments", "").lower()]
add(finding_id="CFIG-COOLFLAME", question="Q5", theme="Gas flames / cool flames", psi_id="PSI-159",
    experiment="CFI-G", material_or_fuel="butane/propane blends", condition="normal gas-jet flames",
    gravity="microgravity (ISS)", metric="tests with a cool flame observed", value=len(cool), unit="tests",
    n_tests=len(cfig),
    finding=f"Cool flames (low-temperature, nearly invisible) were seen in {len(cool)} tests; {noign} tests never formed a hot flame.",
    safety_implication="A fire can keep reacting with no visible flame - visual checks alone are not enough.",
    evidence_type="measured_outcome", confidence="medium", source_file=fn)
byp = defaultdict(list)
for r in lit: byp[round(num(r[PB]), 1)].append(r)
for p, sub in sorted(byp.items()):
    s = sum(r[SE] == "SE" for r in sub)
    add(finding_id=f"CFIG-SELFEXT-{p}BAR", question="Q5", theme="Gas flames / cool flames", psi_id="PSI-159",
        experiment="CFI-G", material_or_fuel="butane/propane/ethane blends", condition=f"~{p} bar",
        pressure_atm_min=round(p / 1.013, 2), pressure_atm_max=round(p / 1.013, 2), gravity="microgravity (ISS)",
        metric="share of lit flames that self-extinguished", value=pct(s, len(sub)), unit="%", n_tests=len(sub),
        finding=f"At ~{p} bar, {s} of {len(sub)} lit flames self-extinguished.",
        safety_implication="Shows how cabin pressure changes whether small flames die out on their own.",
        evidence_type="measured_outcome", source_file=fn)

# ---------------------------------------------------------------- SAFFIRE-I / II
fn, s1 = table("PSI-98", "SAFFIRE")
for r in [r for r in s1 if r["Sample Number"].startswith("S")]:
    d = r["Flow Direction"]
    add(finding_id=f"SAF1-{r['Sample Number']}", question="Q2", theme="Large-scale spacecraft fire",
        psi_id="PSI-98", experiment="SAFFIRE-I", material_or_fuel=r["Material"],
        condition=f"{r['Sample Length (cm)']} x {r['Sample Width (cm)']} cm sheet, {d.lower()} flow",
        o2_pct_min=21.5, o2_pct_max=21.7, flow_cm_s=r["Air Flow (cm/s)"], gravity="microgravity (Cygnus)",
        metric="burn time", value=r["Burn Time (s)"], unit="s", n_tests=1,
        finding=f"Large SIBAL sheet burned {r['Burn Time (s)']} s with the flame spreading {'with' if d.startswith('Con') else 'against'} the airflow.",
        safety_implication="A fire spreading downstream with ventilation lasts ~6x longer than one spreading upstream.",
        evidence_type="measured_outcome", confidence="medium", source_file=fn,
        caveat="Single large-scale test per direction.")
fn, s2 = table("PSI-99", "SAFFIRE")
keys = list(s2[0].keys())
mat = ""
for r in [r for r in s2 if r[keys[0]].startswith("2-")]:
    mat = r[keys[1]] or mat
    ug, g1 = r[keys[11]], r[keys[13]]
    thick = re.sub(r"(?<![\d.])0(\d+) mm", r"0.\1 mm", r[keys[2]])   # '037 mm' typo -> '0.37 mm'
    conservative = ("Complete" in g1 and "29" not in ug) or (ug.startswith("~ 0") and not g1.startswith("~ 0"))
    add(finding_id=f"SAF2-{r[keys[0]]}", question="Q1", theme="Solid-material flammability",
        psi_id="PSI-99", experiment="SAFFIRE-II", material_or_fuel=mat, condition=f"{thick} thick, {r[keys[10]].lower()} flow",
        o2_pct_min=21.5, o2_pct_max=22.1, flow_cm_s=20, gravity="microgravity (Cygnus) vs 1-g ground",
        metric="burn length microgravity / 1-g", value=f"{ug} / {g1}", unit="burn length (29 cm sample)", n_tests=1,
        finding=f"{mat} ({thick}): burned {ug} in microgravity vs {g1} in the matching 1-g test.",
        safety_implication=("Ground (1-g) testing was conservative: it burned more on Earth than in orbit."
                            if conservative else "Burns readily in microgravity at normal air - treat as high risk."
                            if "29" in ug else "Compare with 1-g result."),
        evidence_type="measured_outcome", confidence="low", source_file=fn,
        caveat="One sample per row; spread rate in microgravity given only for SIBAL.")

# ---------------------------------------------------------------- BASS-II (PSI-25)
fn, b2 = table("PSI-25", "BASS-II")
o0, o1 = col(b2[0], "Calibrated  initial"), col(b2[0], "Calibrated final")
co1 = col(b2[0], "Final CO (")
cos = [num(r[co1]) for r in b2 if num(r[co1]) is not None]
top = max(b2, key=lambda r: num(r[co1]) or -1)
drops = [num(r[o0]) - num(r[o1]) for r in b2 if num(r[o0]) and num(r[o1])]
o2i = [num(r[o0]) for r in b2 if num(r[o0])]
add(finding_id="BASS2-CO-MAX", question="Q2", theme="Solid-material flammability", psi_id="PSI-25", experiment="BASS-II",
    material_or_fuel=top["Fuel Sample Material"], condition="small sealed combustion chamber (Glovebox)",
    o2_pct_min=min(o2i), o2_pct_max=max(o2i), gravity="microgravity (ISS)", metric="peak final CO",
    value=num(top[co1]), unit="ppm", n_tests=len(cos),
    finding=f"Carbon monoxide reached up to {num(top[co1]):.0f} ppm (median {st.median(cos):.0f} ppm) after single small burns.",
    safety_implication="Even small fires make toxic CO quickly; CO sensing should be part of fire detection.",
    evidence_type="measured_outcome", source_file=fn, caveat="Chamber volume is small - scale before applying to a cabin.")
add(finding_id="BASS2-O2-COVERAGE", question="Q1", theme="Solid-material flammability", psi_id="PSI-25",
    experiment="BASS-II", material_or_fuel="PMMA rods/films, SIBAL fabric, Nomex", condition="flow & O2 lowered toward extinction",
    o2_pct_min=min(o2i), o2_pct_max=max(o2i), gravity="microgravity (ISS)", metric="tests run",
    value=len(b2), unit="tests", n_tests=len(b2),
    finding=f"{len(b2)} solid-fuel burns between {min(o2i)}% and {max(o2i)}% O2; flow was often turned down until the flame died.",
    safety_implication="This is the dataset for 'lowest oxygen/flow at which a material still burns in orbit' - results are in the reports.",
    evidence_type="test_coverage", source_file=fn)

# ---------------------------------------------------------------- SAME-R (PSI-101)
fn, sr = table("PSI-101", "SAME-R")
for m in sorted({r["Sample Type"] for r in sr}):
    v = [num(r["Rt/R0"]) for r in sr if r["Sample Type"] == m and num(r["Rt/R0"])]
    add(finding_id=f"SAMER-{m.upper()}", question="Q4", theme="Smoke & detection", psi_id="PSI-101",
        experiment="SAME-R", material_or_fuel=m, condition="overheated (not flaming) sample, smoke aged in flow",
        flow_cm_s="0-8.1", gravity="microgravity (ISS)", metric="mean Rt/R0", value=round(st.mean(v), 2),
        unit="ratio", n_tests=len(v),
        finding=f"{m} smoke: Rt/R0 averaged {st.mean(v):.2f} across {len(v)} runs.",
        safety_implication="Smoke properties differ by material, so one detector type may miss some fires.",
        evidence_type="measured_outcome", confidence="low", source_file=fn,
        caveat="Meaning of Rt/R0 (likely particle-size growth ratio) must be confirmed in SAME-R docs.")

# ---------------------------------------------------------------- ACME-BRE (exploration atmospheres)
fn, bre = table("PSI-20", "BRE")
o2set = set()
for r in bre:
    for t in r["Oxygen Conc (percent)"].replace("%", "").split(";"):
        t = num(t)
        if t: o2set.add(t / 100 if t > 100 else t)   # fixes '3400%' / '2100%' typos
lit = sum(int(num(r["Flames Ignited"]) or 0) for r in bre)
add(finding_id="ACMEBRE-COVERAGE", question="Q1", theme="Gas flames / exploration atmospheres", psi_id="PSI-20",
    experiment="ACME BRE", material_or_fuel="ethylene, methane", condition="O2 levels: " + ", ".join(f"{x:g}%" for x in sorted(o2set)),
    o2_pct_min=min(o2set), o2_pct_max=max(o2set), gravity="microgravity (ISS)", metric="flames ignited",
    value=lit, unit="flames", n_tests=lit,
    finding=f"{lit} flames burned at {', '.join(f'{x:g}%' for x in sorted(o2set))} O2 - including NASA's candidate exploration atmospheres (26.5% and 34%).",
    safety_implication="Only dataset here at exploration-atmosphere oxygen levels; results (flame size, soot, limits) are in the reports.",
    evidence_type="test_coverage", source_file=fn, caveat="Pressures varied but not listed in table.")

# ---------------------------------------------------------------- coverage rows for test-matrix-only tables
def coverage(fid, q, theme, psi, part, exp, fuel, cond, n=None, **kw):
    fn, t = table(psi, part)
    n = n or len(t)
    add(finding_id=fid, question=q, theme=theme, psi_id=psi, experiment=exp, material_or_fuel=fuel,
        condition=cond, metric="tests in table", value=n, unit="tests", n_tests=n,
        finding=f"{exp}: {n} tests - {cond}.", gravity=kw.pop("gravity", "microgravity (ISS)"),
        safety_implication=kw.pop("impl", "Outcomes are in the investigation reports, not the table."),
        evidence_type="test_coverage", source_file=fn, **kw)
coverage("BASS-COVERAGE", "Q1", "Solid-material flammability", "PSI-26", "BASS", "BASS", "PMMA, SIBAL, candle wax, spheres", "solid fuels in varied flow")
coverage("SAF3-COVERAGE", "Q2", "Large-scale spacecraft fire", "PSI-100", "SAFFIRE", "SAFFIRE-III", "SIBAL fabric", "94 x 40 cm sheets at 30 cm/s, concurrent & opposed", gravity="microgravity (Cygnus)")
coverage("CFI-COVERAGE", "Q5", "Droplet / liquid-fuel fires", "PSI-39", "CFI", "CFI", "n-dodecane/iso-dodecane", "0.75-5 atm, 17-21% O2, some He", o2_pct_min=17, o2_pct_max=21, pressure_atm_min=0.75, pressure_atm_max=5)
coverage("FLEX2-COVERAGE", "Q3", "Droplet / liquid-fuel fires", "PSI-68", "Flex2", "FLEX-2", "8 fuels incl. decane, ethanol", "0.5-3 atm, 17-30% O2, 0.1-5 cm/s flow", o2_pct_min=17, o2_pct_max=30, pressure_atm_min=0.5, pressure_atm_max=3)
coverage("FD-COVERAGE", "Q5", "Gas flames / soot", "PSI-10", "Normal", "ACME Flame Design", "ethylene, propane", "normal flames, O2 up to 40%")
coverage("FD-INV-COVERAGE", "Q5", "Gas flames / soot", "PSI-10", "Inverse", "ACME Flame Design", "ethylene, propane", "inverse flames")
coverage("CLD-COVERAGE", "Q5", "Gas flames / extinction", "PSI-21", "CLD", "ACME CLD", "methane, ethylene", "coflow laminar diffusion flames")
coverage("EFIELD-COVERAGE", "Q5", "Gas flames / extinction", "PSI-22", "E-FIELD", "ACME E-FIELD", "methane, ethylene", "test days of flames under an electric field", n=21)
coverage("SFLAME-COVERAGE", "Q5", "Gas flames / extinction", "PSI-23", "s-Flame", "ACME s-Flame", "CH4, C2H4, H2", "spherical flames, N2 and He diluted, ~21-30% O2")
coverage("SPICE-COVERAGE", "Q5", "Gas flames / soot", "PSI-107", "Spice", "SPICE", "propylene, propane, ethylene", "smoke-point / soot onset tests")
coverage("SLICE-COVERAGE", "Q5", "Gas flames / extinction", "PSI-106", "Slice", "SLICE", "methane, ethylene, ethane", "lifted-flame stability")
coverage("SAME-COVERAGE", "Q4", "Smoke & detection", "PSI-102", "SAME", "SAME", "Teflon, Kapton, silicone, lampwick, DBP", "overheated-material smoke, 5-10 cm/s")
coverage("DAFT-COVERAGE", "Q4", "Smoke & detection", "PSI-47", "DAFT", "DAFT", "test dust (no fire)", "instrument check for smoke measurement", impl="Validated that ground particle monitors work in orbit (enabled SAME).")
coverage("CFE-COVERAGE", "Q5", "Gas flames / cool flames", "PSI-142", "Data Summary", "Cool-flame ground study", "DME, heptane, decane, dodecane", "published figures with DOI links", gravity="1-g / modelling")

# ---------------------------------------------------------------- explicit evidence gaps
for fid, q, text in [
    ("GAP-PARTIAL-G", "Q1", "No test in this dataset was run at lunar (0.17 g) or Martian (0.38 g) gravity."),
    ("GAP-EXPLORATION-SOLIDS", "Q1", "No solid-material burn here was run at the 34% O2 / ~0.56 atm exploration atmosphere."),
    ("GAP-DETECTOR-RESPONSE", "Q4", "Detector-by-material response is not in the tables - must come from SAME/SAME-R reports."),
]:
    add(finding_id=fid, question=q, theme="Evidence gap", finding=text, evidence_type="evidence_gap",
        confidence="high", safety_implication="Results must be extrapolated - flag lower confidence for Moon/Mars use.")

for r in rows:
    r["question"] = f"{r['question']}: {QUESTIONS[r['question']]}"
with open(OUT, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=COLUMNS); w.writeheader(); w.writerows(rows)
print(f"wrote {len(rows)} findings -> {OUT}")
print(Counter(r["evidence_type"] for r in rows))
