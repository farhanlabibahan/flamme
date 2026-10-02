#!/usr/bin/env python3
"""
extract_findings_from_pdfs.py - Step 2b: pull findings out of the NASA report PDFs
with Claude, in the SAME columns as findings_tables.csv, with page citations.

Setup (once):
    pip3 install anthropic pypdf
    export ANTHROPIC_API_KEY=sk-ant-...          # from console.anthropic.com
First download the PDFs:
    cd flame_in_freefall_data && python3 download_ntrs.py && cd ..
Run:
    python3 findings/extract_findings_from_pdfs.py                    # all PDFs in ntrs_pdfs/
    python3 findings/extract_findings_from_pdfs.py --limit 3          # try 3 first to check cost/quality
    python3 findings/extract_findings_from_pdfs.py --pdfs some/folder # e.g. psi_data/*/Reports
Output: findings/findings_ai.csv  (re-runs skip PDFs already processed)
Then:   python3 findings/merge_findings.py
"""
import argparse, csv, glob, json, logging, os, re, sys, warnings
warnings.filterwarnings("ignore")
logging.getLogger("pypdf").setLevel(logging.ERROR)   # hide harmless font warnings
from anthropic import Anthropic
from pypdf import PdfReader

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT = os.path.join(HERE, "findings_ai.csv")
with open(os.path.join(HERE, "findings_tables.csv"), encoding="utf-8") as fh:
    COLUMNS = next(csv.reader(fh))

MODEL = "claude-sonnet-5-5"
CHUNK_PAGES = 12          # pages per request
QUESTIONS = """Q1: Which materials burn most easily (incl. exploration atmospheres)?
Q2: How big / fast does a spacecraft fire get, and what does it do to cabin air?
Q3: What puts a microgravity fire out?
Q4: Can detectors catch a microgravity fire early?
Q5: When do flames self-extinguish, go sooty, or turn into cool flames?"""

PROMPT = """You are extracting fire-safety findings from a NASA microgravity combustion report for a dashboard.

Return ONLY a JSON array (no prose). Each element is one concrete, quantitative or clearly stated
RESULT from this text (not background, not methods, not results quoted from other papers). Skip anything vague.
Fields (use "" when unknown, numbers as plain numbers):
  question            one of "Q1".."Q5" (see list)
  theme               short theme, e.g. "Solid-material flammability"
  experiment          e.g. "BASS", "SAFFIRE-II", "FLEX"
  material_or_fuel
  condition           short text of the test conditions
  o2_pct_min, o2_pct_max, pressure_atm_min, pressure_atm_max, flow_cm_s
  gravity             e.g. "microgravity (ISS)", "1-g ground", "drop tower", "partial gravity"
  metric, value, unit the measured quantity
  n_tests             number of tests behind it if stated
  finding             one plain-English sentence a non-expert understands
  safety_implication  one sentence: what it means for crew fire safety
  confidence          "high" (many tests / clear data), "medium", "low" (single test, preliminary)
  page                PDF page number(s) where the result appears, e.g. "14" or "14-15"
  quote               the exact supporting sentence from the text (max 40 words)

Questions:
{questions}

Report: {title}
Pages {first}-{last}:
{text}"""

def pages_text(path):
    reader = PdfReader(path)
    for i, p in enumerate(reader.pages, 1):
        try:
            yield i, re.sub(r"[ \t]+", " ", p.extract_text() or "")
        except Exception:
            yield i, ""

def parse_json(txt):
    m = re.search(r"\[.*\]", txt, re.S)
    try:
        return json.loads(m.group(0)) if m else []
    except json.JSONDecodeError:
        return []

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdfs", default=os.path.join(HERE, "..", "flame_in_freefall_data", "ntrs_pdfs"))
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()
    pdfs = sorted(glob.glob(os.path.join(a.pdfs, "**", "*.pdf"), recursive=True))
    if not pdfs:
        sys.exit(f"No PDFs found under {a.pdfs}. Run download_ntrs.py first.")
    titles = {}
    ntrs = os.path.join(HERE, "..", "flame_in_freefall_data", "ntrs_reports.csv")
    if os.path.exists(ntrs):
        titles = {r["ntrs_id"]: r["title"] for r in csv.DictReader(open(ntrs, encoding="utf-8"))}

    cols = COLUMNS + ["page", "quote"]
    done = set()
    if os.path.exists(OUT):
        done = {r["source_file"] for r in csv.DictReader(open(OUT, encoding="utf-8"))}
    new_file = not os.path.exists(OUT)
    fh = open(OUT, "a", newline="", encoding="utf-8")
    w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
    if new_file: w.writeheader()

    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key.startswith("sk-ant-"):
        sys.exit("ANTHROPIC_API_KEY is missing or wrong. Get a key starting with 'sk-ant-' from console.anthropic.com "
                 "and run: export ANTHROPIC_API_KEY=sk-ant-...")
    client = Anthropic()
    todo = [p for p in pdfs if os.path.basename(p) not in done]
    if a.limit: todo = todo[: a.limit]
    for path in todo:
        name = os.path.basename(path)
        title = titles.get(os.path.splitext(name)[0], name)
        pages = list(pages_text(path))
        if sum(len(t) for _, t in pages) < 500:
            print(f"skip (no text layer - scanned PDF?): {name}"); continue
        n = 0
        for start in range(0, len(pages), CHUNK_PAGES):
            chunk = pages[start: start + CHUNK_PAGES]
            text = "\n".join(f"[page {i}]\n{t}" for i, t in chunk)
            msg = client.messages.create(
                model=MODEL, max_tokens=8000,
                messages=[{"role": "user", "content": PROMPT.format(
                    questions=QUESTIONS, title=title, first=chunk[0][0], last=chunk[-1][0], text=text)}])
            for k, f in enumerate(parse_json(msg.content[0].text)):
                if not isinstance(f, dict) or not f.get("finding"): continue
                f["finding_id"] = f"RPT-{os.path.splitext(name)[0]}-{start + 1}-{k + 1}"
                f["evidence_type"] = "report_extracted"
                f["source_file"] = name
                f["caveat"] = "AI-extracted - verify against the quoted page before publishing."
                w.writerow(f); n += 1
            fh.flush()
        print(f"{n:3} findings  {name}  {title[:60]}")
    fh.close()
    print(f"-> {OUT}")

if __name__ == "__main__":
    main()
