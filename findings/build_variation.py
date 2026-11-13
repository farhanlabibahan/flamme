"""Builds src/variationData.json: for each PSI investigation, which test conditions
VARIED across its test-matrix rows and which were HELD CONSTANT, computed directly
from flame_in_freefall_data/cleaned/cleaned_values.csv (no model, no guessing).
Which columns count as 'conditions' is curated in variation_config.py; everything
else is listed as 'also recorded'. Run:  python3 findings/build_variation.py
"""
import csv, json, re, collections, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from variation_config import CFG

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'flame_in_freefall_data/cleaned/cleaned_values.csv'
OUT = ROOT / 'src/variationData.json'

def num(s):
    try: return float(str(s).strip())
    except ValueError: return None

def fmt(x):
    if x == round(x): return f'{x:.0f}' if abs(x) >= 1e6 else f'{x:g}'
    return f'{x:.3g}'

def clean_text(v, o):
    v = re.sub(r'\s+', ' ', v).strip()
    v = re.sub(r'%\s*(?=[A-Za-z])', '% ', v)
    for pat, rep in o.get('sub', []): v = re.sub(pat, rep, v)
    if o.get('cut'): v = re.sub(o['cut'], '', v).strip()
    if o.get('cap'): v = v.capitalize()
    return v

rows = collections.defaultdict(lambda: collections.defaultdict(list))
for r in csv.DictReader(open(SRC, encoding='utf-8')):
    if r['row_kind'] != 'data': continue
    v = (r['normalized_value'] or r['raw_value']).strip()
    if v: rows[r['psi_id']][r['column_key']].append((v, r['raw_value'].strip() or v))

def summarize(pairs, unit, o):
    vals = [a for a, _ in pairs]; raws = [b for _, b in pairs]
    if o.get('positive'): vals = [a for a in vals if (num(a) or 0) > 0]; raws = vals
    mode, scale = o.get('mode', 'auto'), o.get('scale', 1)
    u = f' {unit}' if unit else ''
    if mode == 'count':
        return 'varied', f'{len({clean_text(v, o) for v in raws})} distinct descriptions'
    if mode == 'planned':
        d = list(dict.fromkeys(clean_text(v, o) for v in raws))
        return 'varied', '; '.join(d) + (u if unit and not re.search(r'[a-zA-Z%]', d[0]) else '') + ' (planned range)'
    if mode == 'extract':
        ns = sorted(n for n in {float(m) for v in raws for m in re.findall(r'\d+\.?\d*', v)} if not (unit == '%' and n > 100))
        if len(ns) == 1: return 'constant', f'{fmt(ns[0])}{u}'
        if len(ns) <= 8: return 'varied', ', '.join(fmt(n) for n in ns) + u
        return 'varied', f'{fmt(ns[0])}–{fmt(ns[-1])}{u} ({len(ns)} values)'
    ok = [n * scale for n in (num(v) for v in vals) if n is not None]
    if mode == 'auto' and len(ok) >= 0.8 * len(vals):
        d = sorted(set(round(n, 4) for n in ok))
        if len(d) == 1: return 'constant', f'{fmt(d[0])}{u}'
        if len(d) <= 6: return 'varied', ', '.join(fmt(n) for n in d) + u
        return 'varied', f'{fmt(d[0])}–{fmt(d[-1])}{u} ({len(d)} distinct values)'
    cnt = collections.Counter(t for t in (clean_text(v, o) for v in raws) if t and num(t) is None)
    if not cnt: return None, None
    if any(re.search('[A-Za-z]', k) for k in cnt): u = ''
    if len(cnt) == 1: return 'constant', next(iter(cnt)) + u
    top = [k for k, _ in cnt.most_common(6)]
    return 'varied', ', '.join(top) + (f' (+{len(cnt) - 6} more)' if len(cnt) > 6 else '') + u

out = {}
for psi, cfg in CFG.items():
    cols = rows.get(psi, {})
    varied, constant = [], []
    for key, label, unit, o in cfg['cond']:
        vals = cols.get(key)
        if not vals: continue
        kind, text = summarize(vals, unit, o)
        if kind == 'varied': varied.append({'label': label, 'value': text})
        elif kind == 'constant': constant.append({'label': label, 'value': text})
    out[psi] = {'varied': varied, 'constant': constant, 'recorded': cfg['rec'], 'notes': cfg.get('notes', []), 'rows': max((len(v) for v in cols.values()), default=0)}
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print('wrote', OUT, len(out), 'investigations')
for p, d in out.items():
    print(p, d['rows'], 'VARIED:', [(x['label'], x['value']) for x in d['varied']], '| CONST:', [(x['label'], x['value']) for x in d['constant']])
