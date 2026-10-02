#!/usr/bin/env python3
"""Download the 40 NASA NTRS report PDFs listed in ntrs_reports.csv -> ntrs_pdfs/<topic>/
Re-run any time: files already downloaded are skipped."""
import csv, os, re, sys, time, warnings
warnings.filterwarnings("ignore")          # hides the harmless LibreSSL warning on macOS
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ntrs_pdfs")
S = requests.Session()
S.headers["User-Agent"] = "Mozilla/5.0 (flame-in-freefall-spaceapps)"

with open(os.path.join(HERE, "ntrs_reports.csv"), encoding="utf-8") as fh:
    rows = list(csv.DictReader(fh))

ok = fail = 0
for i, r in enumerate(rows, 1):
    folder = os.path.join(OUT, re.sub(r"[^\w\-]+", "_", r["topic"]))
    os.makedirs(folder, exist_ok=True)
    out = os.path.join(folder, f"{r['ntrs_id']}.pdf")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        ok += 1
        continue
    print(f"[{i}/{len(rows)}] {r['ntrs_id']} {r['title'][:55]} ...", end=" ", flush=True)
    try:
        with S.get(r["pdf_url"], stream=True, timeout=(20, 60)) as resp:   # 20 s to connect, 60 s max silence
            resp.raise_for_status()
            got, start = 0, time.time()
            with open(out + ".part", "wb") as f:
                for chunk in resp.iter_content(1 << 16):
                    f.write(chunk); got += len(chunk)
                    if time.time() - start > 180:
                        raise TimeoutError("took over 3 min")
        with open(out + ".part", "rb") as f:
            if not f.read(5).startswith(b"%PDF"):
                raise ValueError("server did not return a PDF")
        os.replace(out + ".part", out)
        ok += 1
        print(f"ok ({got/1e6:.1f} MB)")
    except Exception as e:
        fail += 1
        if os.path.exists(out + ".part"): os.remove(out + ".part")
        print(f"FAILED - {type(e).__name__}: {str(e)[:80]}")
    time.sleep(1)

print(f"\n{ok} downloaded, {fail} failed. Re-run to retry failures.")
