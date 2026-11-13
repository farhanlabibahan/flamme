#!/usr/bin/env python3
"""Download the free B-roll for the Flammé judging video into ./capcut_edit/.

Usage (from the flamme repo root, or anywhere):
    python3 scripts/download_broll.py                # download everything it can
    python3 scripts/download_broll.py --list         # show what would be downloaded
    python3 scripts/download_broll.py --out ~/Desktop/capcut_edit

Sources
- NASA (SVS, Image and Video Library, Internet Archive): public domain, no key needed.
- Pexels: their site blocks scripts, so this uses the free Pexels API.
  Get a key at https://www.pexels.com/api/ and run:
      PEXELS_API_KEY=your_key python3 scripts/download_broll.py
- Pixabay: free API key from https://pixabay.com/api/docs/ (PIXABAY_API_KEY=...).
Without a key, those clips are skipped and listed in capcut_edit/MANUAL_DOWNLOADS.txt.

Only the Python standard library is used. Files that already exist are skipped,
so you can re-run it safely after an interruption.
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) FlammeBrollDownloader/1.0"

# (folder, filename, kind, id_or_url, page_for_credit)
CLIPS = [
    # 01 · Hook
    ("01_hook", "astronaut_helmet", "pexels", "7649288", "https://www.pexels.com/video/an-astronaut-wearing-a-space-helmet-7649288/"),
    ("01_hook", "astronaut_in_space_CGI", "pexels", "5299577", "https://www.pexels.com/video/an-astronaut-in-the-space-5299577/"),
    ("01_hook", "earth_from_orbit_NASA", "url", "http://svs.gsfc.nasa.gov/vis/a010000/a010700/a010766/Earth_View_shuttle_over_clouds.mov", "https://svs.gsfc.nasa.gov/10766"),
    ("01_hook", "earth_from_space_4k", "pexels", "30895551", "https://www.pexels.com/video/4k-view-of-earth-from-space-in-high-definition-30895551/"),
    ("01_hook", "station_overlooking_earth_CGI", "pexels", "29780760", "https://www.pexels.com/video/astronaut-overlooking-earth-from-space-station-29780760/"),
    ("01_hook", "life_on_ISS_NASA", "archive", "ISSVideoResourceLifeOnStation720p", "https://archive.org/details/ISSVideoResourceLifeOnStation720p"),
    ("01_hook", "fire_burning", "pexels", "1856931", "https://www.pexels.com/video/fire-burning-1856931/"),
    ("01_hook", "candle_closeup", "pexels", "10398336", "https://www.pexels.com/video/close-up-on-flame-in-candle-10398336/"),
    ("01_hook", "candle_closeup_2", "pexels", "4106194", "https://www.pexels.com/video/a-close-up-shot-of-a-burning-candle-4106194/"),
    ("01_hook", "candle_blown_out", "pexels", "3344052", "https://www.pexels.com/video/blowing-out-a-candle-flame-3344052/"),
    ("01_hook", "HERO_spherical_flame_FLEX2_NASA", "url", "http://svs.gsfc.nasa.gov/vis/a010000/a011600/a011640/162_JellyfishFlame-540-MASTER_high.mp4", "https://svs.gsfc.nasa.gov/11640"),
    ("01_hook", "candle_1g_vs_microgravity_NASA", "url", "https://www.nasa.gov/wp-content/uploads/2023/03/candle_flames.gif", "https://www.nasa.gov/image-article/candle-flame-1g-vs-microgravity/"),
    # 02 · Problem
    ("02_problem", "saffire_V_NASA", "nasa", "GRC-2021-CN-00008", "https://images.nasa.gov/details/GRC-2021-CN-00008"),
    ("02_problem", "saffire_VI_cygnus_NASA", "nasa", "Saf-VI S8C3+C4 1-sided PMMA_unmapped_jpeg-20x no text", "https://images.nasa.gov/"),
    ("02_problem", "ACME_combustion_NASA", "nasa", "GRC-2020-CM-0167.3", "https://images.nasa.gov/details/GRC-2020-CM-0167.3"),
    ("02_problem", "SoFIE_flame_spin_NASA", "nasa", "SoFIE-GEL", "https://images.nasa.gov/details/SoFIE-GEL"),
    ("02_problem", "pile_of_papers", "pexels", "26654077", "https://www.pexels.com/video/a-pile-of-papers-on-a-wooden-floor-26654077/"),
    ("02_problem", "scientist_lab", "pexels", "4121354", "https://www.pexels.com/video/scientist-working-in-a-laboratory-4121354/"),
    # 03-04 · Intro and demo
    ("03_04_intro_demo", "students_laptops", "pexels", "7777997", "https://www.pexels.com/video/students-using-laptops-7777997/"),
    ("03_04_intro_demo", "working_on_design", "pexels", "4941558", "https://www.pexels.com/video/man-working-on-a-design-4941558/"),
    # 05 · Impact
    ("05_impact", "researcher", "pexels", "9573566", "https://www.pexels.com/video/a-scientist-working-at-a-laboratory-9573566/"),
    ("05_impact", "engineer", "pexels", "6964021", "https://www.pexels.com/video/a-man-working-on-computers-and-gadgets-6964021/"),
    ("05_impact", "student", "pexels", "6985337", "https://www.pexels.com/video/student-using-his-laptop-6985337/"),
    ("05_impact", "scientist_inside_lab", "pexels", "8381452", "https://www.pexels.com/video/a-scientist-working-inside-a-laboratory-8381452/"),
    # 06 · Closing
    ("06_closing", "rocket_launch", "pixabay", "rocket launch", "https://pixabay.com/videos/search/rocket%20launch/"),
    ("06_closing", "orion_reentry_NASA", "nasa", "art001m1203451716", "https://images.nasa.gov/details/art001m1203451716"),
    ("06_closing", "moon_surface", "pexels", "13693702", "https://www.pexels.com/video/close-up-view-of-moon-surface-13693702/"),
    ("06_closing", "mars_rotation_CGI", "pexels", "33474467", "https://www.pexels.com/video/mars-rotation-in-space-with-shadow-detail-33474467/"),
    ("06_closing", "fire_burning_2", "pexels", "5968828", "https://www.pexels.com/video/fire-burning-5968828/"),
    ("06_closing", "earth_at_night", "pexels", "854913", "https://www.pexels.com/video/view-of-earth-at-night-from-space-854913/"),
]


def get_json(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def ext_of(url):
    path = urllib.parse.urlparse(url).path
    m = re.search(r"\.(mp4|mov|webm|gif|m4v)$", path, re.I)
    return "." + m.group(1).lower() if m else ".mp4"


# --- resolvers: each returns a direct file URL ---

def resolve_nasa(nasa_id):
    q = urllib.parse.quote(nasa_id)
    files = get_json(f"https://images-assets.nasa.gov/video/{q}/collection.json")
    mp4s = [f for f in files if f.lower().endswith(".mp4")]
    fix = lambda f: urllib.parse.quote(f.replace("http://", "https://"), safe=":/~%")
    # Take the best variant under 300 MB ("orig" can be several GB; Orion re-entry is 3.5 GB).
    cands = []
    for pref in ("~large.mp4", "~orig.mp4", "~medium.mp4", "~small.mp4", "~mobile.mp4"):
        cands += [fix(f) for f in mp4s if f.endswith(pref)]
    for u in cands:
        try:
            req = urllib.request.Request(u, method="HEAD", headers={"User-Agent": UA})
            size = int(urllib.request.urlopen(req, timeout=30).headers.get("Content-Length") or 0)
            if 0 < size <= 300e6:
                return u
        except Exception:
            continue
    if cands:
        return cands[-1]
    raise RuntimeError("no mp4 in NASA collection")


def resolve_archive(ident):
    d = get_json(f"https://archive.org/metadata/{ident}")
    mp4s = [f for f in d["files"] if f["name"].lower().endswith(".mp4")]
    if not mp4s:
        raise RuntimeError("no mp4 in archive item")
    best = max(mp4s, key=lambda f: int(f.get("size", 0)))
    return f"https://archive.org/download/{ident}/{urllib.parse.quote(best['name'])}"


def resolve_pexels(vid, key):
    if not key:
        raise PermissionError("set PEXELS_API_KEY")
    d = get_json(f"https://api.pexels.com/videos/videos/{vid}", {"Authorization": key})
    files = [f for f in d["video_files"] if f.get("file_type") == "video/mp4" and f.get("width")]
    # Prefer 1920 wide; else the largest file under 4K to keep downloads reasonable.
    hd = [f for f in files if f["width"] == 1920]
    pick = hd[0] if hd else max([f for f in files if f["width"] <= 2560] or files, key=lambda f: f["width"])
    return pick["link"]


def resolve_pixabay(query, key):
    if not key:
        raise PermissionError("set PIXABAY_API_KEY")
    q = urllib.parse.quote(query)
    d = get_json(f"https://pixabay.com/api/videos/?key={key}&q={q}&per_page=3&safesearch=true")
    if not d.get("hits"):
        raise RuntimeError("no Pixabay results")
    v = d["hits"][0]["videos"]
    for size in ("large", "medium", "small"):
        if v.get(size, {}).get("url"):
            return v[size]["url"]
    raise RuntimeError("no Pixabay file")


def download(url, dest):
    tmp = dest.with_suffix(dest.suffix + ".part")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
        total = int(r.headers.get("Content-Length") or 0)
        got = 0
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
            got += len(chunk)
            if total:
                sys.stdout.write(f"\r    {got / 1e6:6.1f} / {total / 1e6:.1f} MB")
                sys.stdout.flush()
    tmp.rename(dest)
    sys.stdout.write("\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="capcut_edit", help="output folder (default: ./capcut_edit)")
    ap.add_argument("--list", action="store_true", help="only print the clip list")
    args = ap.parse_args()

    out = Path(os.path.expanduser(args.out)).resolve()
    pexels_key = os.environ.get("PEXELS_API_KEY", "").strip()
    pixabay_key = os.environ.get("PIXABAY_API_KEY", "").strip()

    if args.list:
        for folder, name, kind, ref, page in CLIPS:
            print(f"{folder}/{name:38s} {kind:8s} {page}")
        return

    out.mkdir(parents=True, exist_ok=True)
    ok, skipped, failed, manual = 0, 0, 0, []
    credits = ["Flammé judging video · B-roll credits", ""]

    for i, (folder, name, kind, ref, page) in enumerate(CLIPS, 1):
        d = out / folder
        d.mkdir(exist_ok=True)
        print(f"[{i}/{len(CLIPS)}] {folder}/{name}")
        existing = list(d.glob(name + ".*"))
        existing = [p for p in existing if not p.name.endswith(".part")]
        if existing:
            print("    already downloaded")
            skipped += 1
            credits.append(f"{folder}/{existing[0].name}  ·  {page}")
            continue
        try:
            if kind == "url":
                url = ref
            elif kind == "nasa":
                url = resolve_nasa(ref)
            elif kind == "archive":
                url = resolve_archive(ref)
            elif kind == "pexels":
                url = resolve_pexels(ref, pexels_key)
            elif kind == "pixabay":
                url = resolve_pixabay(ref, pixabay_key)
            else:
                raise ValueError(kind)
            dest = d / (name + ext_of(url))
            download(url, dest)
            ok += 1
            credits.append(f"{folder}/{dest.name}  ·  {page}")
        except PermissionError as e:
            print(f"    skipped ({e}); download manually from {page}")
            manual.append(f"{folder}/{name}: {page}")
        except Exception as e:  # keep going on any single failure
            print(f"    FAILED: {e}")
            failed += 1
            manual.append(f"{folder}/{name}: {page}   (error: {e})")

    (out / "CREDITS.txt").write_text(
        "\n".join(credits)
        + "\n\nNASA material is public domain; NASA does not endorse Flammé.\n"
        "Pexels and Pixabay clips are used under their free licences.\n"
    )
    if manual:
        (out / "MANUAL_DOWNLOADS.txt").write_text(
            "Open each page, press Free download, and save the file into the folder shown.\n\n" + "\n".join(manual) + "\n"
        )

    print(f"\nDone. downloaded {ok}, already had {skipped}, need manual/failed {len(manual)}")
    print(f"Folder: {out}")
    if manual:
        print(f"See {out / 'MANUAL_DOWNLOADS.txt'}")
        if not pexels_key:
            print("Tip: get a free key at https://www.pexels.com/api/ then run again with PEXELS_API_KEY=... to fetch the Pexels clips.")


if __name__ == "__main__":
    main()
