#!/usr/bin/env python3
"""
psi_scraper.py - Scrape NASA PSI (Physical Sciences Informatics) combustion datasets
for the "Flame in Freefall" Space Apps challenge.

Uses the same JSON API the psi.nasa.gov web app uses (verified 2026-10-01):
  GET  https://psi.nasa.gov/geode-py/ws/repo/search?term=&source=psi&type=investigation&size=1000
  GET  https://psi.nasa.gov/geode-py/ws/repo/investigations/<PSI-ID>          (metadata, field "version")
  POST https://psi.nasa.gov/geode-py/ws/files/v2                              (file tree)
       body {"folder":"","fileType":"study","studyId":"<PSI-ID>","version":<ver>,"obfuscationcode":null}
  GET  https://psi.nasa.gov/geode-py/ws/studies/<PSI-ID>/download?file=<filename>&version=<file ver>
       -> redirects to the file on S3 (add &redirect=false to get the signed URL as text)

Usage
  pip install requests
  python psi_scraper.py manifest                 # full file manifest of every combustion investigation -> psi_manifest.csv
  python psi_scraper.py download --tables        # experimental test-matrix CSVs (~200 KB total)  <- start here
  python psi_scraper.py download --analysis      # tables + analyzed data + reports + science docs (~2 GB)
  python psi_scraper.py download --ids PSI-69 --categories "Raw Data" --ext csv,txt   # targeted raw pulls
Raw data is ~14 TB in total, so raw downloads are opt-in and filterable.
"""
import argparse, csv, json, os, sys, time, urllib.parse
import requests

BASE = "https://psi.nasa.gov/geode-py/ws"
S = requests.Session()
S.headers["User-Agent"] = "flame-in-freefall-spaceapps/1.0"

def get_json(url, **kw):
    for attempt in range(4):
        try:
            r = S.request(kw.pop("method", "GET"), url, timeout=120, **kw)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))

def combustion_investigations():
    hits = get_json(f"{BASE}/repo/search?term=&source=psi&type=investigation&size=1000")["hits"]["hits"]
    return [h["_source"] for h in hits if "combustion" in (h["_source"].get("Research Area") or "").lower()]

def walk(nodes, out):
    for n in nodes or []:
        if n.get("directory") is False and n.get("key"):
            out.append(n)
        else:
            walk(n.get("files"), out)
    return out

def file_list(psi_id):
    meta = get_json(f"{BASE}/repo/investigations/{psi_id}")
    ver = (meta.get("versionInfo") or {}).get("version") or meta.get("version") or 1
    body = {"folder": "", "fileType": "study", "studyId": psi_id, "version": ver, "obfuscationcode": None}
    tree = get_json(f"{BASE}/files/v2", method="POST", json=body)
    return meta, ver, walk(tree.get("files"), [])

def dl_url(psi_id, fname, fver):
    return f"{BASE}/studies/{psi_id}/download?file={urllib.parse.quote(fname)}&version={fver}"

def build_manifest(path="psi_manifest.csv"):
    rows = []
    for inv in combustion_investigations():
        pid = inv["Accession"]
        meta, ver, files = file_list(pid)
        print(f"{pid:8} {inv.get('Acronym') or '':22} v{ver}  {len(files)} files", file=sys.stderr)
        for f in files:
            name = f["key"].split("/")[-1]
            rows.append({
                "psi_id": pid, "acronym": inv.get("Acronym") or "", "category": f.get("sortingCategory") or "",
                "subfolder": (f.get("subcategory") or "").strip(), "filename": name,
                "bytes": int(f.get("bytes_size") or 0), "file_version": f.get("version"),
                "restricted": bool(f.get("restricted") or f.get("restrictedAccess")),
                "download_url": dl_url(pid, name, f.get("version")),
            })
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    print(f"wrote {len(rows)} rows -> {path}", file=sys.stderr)
    return path

DOC_CATS = {"Experimental table", "Analyzed Data", "Reports", "Science Documents", "Investigation Metadata Files"}

def download(args):
    if not os.path.exists(args.manifest):
        build_manifest(args.manifest)
    with open(args.manifest, encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    cats = set(c.strip() for c in args.categories.split(",")) if args.categories else None
    if args.tables: cats = {"Experimental table"}
    if args.analysis: cats = DOC_CATS
    ids = set(args.ids.split(",")) if args.ids else None
    exts = set("." + e.strip().lower().lstrip(".") for e in args.ext.split(",")) if args.ext else None
    sel = [r for r in rows
           if (not cats or r["category"] in cats)
           and (not ids or r["psi_id"] in ids)
           and (not exts or os.path.splitext(r["filename"])[1].lower() in exts)
           and r["restricted"] != "True"]
    total = sum(int(r["bytes"]) for r in sel)
    print(f"{len(sel)} files, {total/1e9:.2f} GB", file=sys.stderr)
    if total > args.max_gb * 1e9:
        sys.exit(f"Selection exceeds --max-gb {args.max_gb}. Narrow it or raise the limit.")
    for r in sel:
        out = os.path.join(args.out, r["psi_id"], r["category"], r["subfolder"], r["filename"])
        if os.path.exists(out) and os.path.getsize(out) == int(r["bytes"]):
            continue
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with S.get(r["download_url"], stream=True, timeout=600) as resp:
            resp.raise_for_status()
            with open(out + ".part", "wb") as fh:
                for chunk in resp.iter_content(1 << 20):
                    fh.write(chunk)
        os.replace(out + ".part", out)
        print("ok", out, file=sys.stderr)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("manifest"); m.add_argument("--out", default="psi_manifest.csv")
    d = sub.add_parser("download")
    d.add_argument("--manifest", default="psi_manifest.csv")
    d.add_argument("--out", default="psi_data")
    d.add_argument("--tables", action="store_true", help="experimental test-matrix CSVs only")
    d.add_argument("--analysis", action="store_true", help="tables + analyzed data + reports + science docs")
    d.add_argument("--categories", help="comma list, e.g. 'Raw Data,Calibration'")
    d.add_argument("--ids", help="comma list of PSI IDs, e.g. PSI-69,PSI-68")
    d.add_argument("--ext", help="comma list of extensions, e.g. csv,txt")
    d.add_argument("--max-gb", type=float, default=50)
    a = ap.parse_args()
    if a.cmd == "manifest":
        build_manifest(a.out)
    else:
        download(a)
