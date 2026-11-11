#!/usr/bin/env python3
"""Builds src/investigationsData.json for the /investigations page.
Catalog facts come from flame_in_freefall_data/investigations.csv and cleaned_values.csv.
Hardware, fuel phase and safety pillars are curated from the challenge brief (not in PSI metadata)."""
import csv, json, os, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "flame_in_freefall_data")
HARDWARE = {  # from the challenge brief
 "ACME hardware (CIR)": ["PSI-20","PSI-21","PSI-22","PSI-23","PSI-10","PSI-159"],
 "MDCA droplet apparatus (CIR)": ["PSI-69","PSI-68","PSI-39"],
 "MSG fan-driven flow duct": ["PSI-26","PSI-25","PSI-107","PSI-106"],
 "Saffire (Cygnus free-flyer)": ["PSI-98","PSI-99","PSI-100"],
 "Smoke / aerosol instruments": ["PSI-102","PSI-101","PSI-47"],
 "Ground study (uses flight data)": ["PSI-117","PSI-142","PSI-115","PSI-62","PSI-60"],
}
FUEL = {"PSI-69":"Liquid","PSI-68":"Liquid","PSI-39":"Liquid","PSI-117":"Liquid","PSI-142":"Liquid",
 "PSI-26":"Solid","PSI-25":"Solid","PSI-98":"Solid","PSI-99":"Solid","PSI-100":"Solid","PSI-62":"Solid",
 "PSI-102":"Solid (smoke)","PSI-101":"Solid (smoke)","PSI-115":"Aerosol","PSI-47":"Aerosol / dust",
 "PSI-107":"Gas","PSI-106":"Gas","PSI-20":"Gas (emulates solid)","PSI-21":"Gas","PSI-22":"Gas","PSI-23":"Gas","PSI-10":"Gas","PSI-159":"Gas","PSI-60":"Gas"}
PILLARS = {"Prevention":["PSI-26","PSI-25","PSI-98","PSI-99","PSI-100","PSI-20","PSI-159","PSI-142","PSI-62"],
 "Detection":["PSI-102","PSI-101","PSI-47","PSI-115","PSI-99"],
 "Suppression":["PSI-69","PSI-68","PSI-26","PSI-25","PSI-142"]}
ALIAS = {"FLEX":"PSI-69","BASS-II":"PSI-25","BASS":"PSI-26","SAME-R":"PSI-101","SAME-R (SAME-2)":"PSI-101","DAFT":"PSI-47",
 "ACME BRE":"PSI-20","ACME CLD":"PSI-21","ACME CLD Flame":"PSI-21","ACME Flame Design":"PSI-10","ACME E-FIELD":"PSI-22","CFI-G":"PSI-159",
 "SAFFIRE-II":"PSI-99","SAFFIRE-I":"PSI-98","SAFFIRE-III":"PSI-100","Saffire II + ground tests":"PSI-99","Saffire II pre-flight ground tests":"PSI-99",
 "BASS-II + ground tests":"PSI-25","BASS / BASS-II":"PSI-25"}
hw = {p:h for h,ps in HARDWARE.items() for p in ps}
rows = collections.Counter()
seen = set()
for r in csv.DictReader(open(os.path.join(D,"cleaned","cleaned_values.csv"),encoding="utf-8")):
    if r["row_kind"]=="data": seen.add(r["record_id"])
for rid in seen: rows[rid.split(":")[0]] += 1
fmap = collections.defaultdict(list)
for f in csv.DictReader(open(os.path.join(ROOT,"findings","findings.csv"),encoding="utf-8")):
    if f["evidence_type"]=="evidence_gap": continue
    p = f["psi_id"] or ALIAS.get(f["experiment"])
    if p: fmap[p].append(f["finding_id"])
out=[]
for r in csv.DictReader(open(os.path.join(D,"investigations.csv"),encoding="utf-8")):
    p=r["psi_id"]
    out.append({"id":p,"name":r["acronym"] or r["title"],"title":r["title"],"type":r["type"],"subarea":r["subarea"],"platform":r["platform"],
      "start":r["start"][:4],"end":r["end"][:4],"doi":r["doi"],"url":r["psi_page"],"keywords":r["keywords"],"objective":r["objective"],
      "related":r["related"],"hardware":hw.get(p,"Other"),"fuel":FUEL.get(p,"n/a"),
      "pillars":[k for k,v in PILLARS.items() if p in v],"test_rows":rows.get(p,0),"finding_ids":fmap.get(p,[])})
json.dump(out,open(os.path.join(ROOT,"src","investigationsData.json"),"w"),separators=(",",":"))
print(len(out),"investigations;",sum(len(o["finding_ids"]) for o in out),"findings linked; test rows",sum(rows.values()))
