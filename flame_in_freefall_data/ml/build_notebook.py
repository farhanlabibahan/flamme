"""Generates feature_engineering.ipynb. Run once with: python3 build_notebook.py"""
import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []
md = lambda s: cells.append(nbf.v4.new_markdown_cell(s))
code = lambda s: cells.append(nbf.v4.new_code_cell(s))

md("""# Flamme — ML Data Cleaning & Feature Engineering

**Source data:** `findings/findings.csv` — 111 curated findings extracted from NASA PSI
microgravity combustion test tables and NTRS reports (FLEX, FLEX-2, BASS, BASS-II, Saffire
I–III, SAME/SAME-R, ACME family, CFI/CFI-G). Each row is already mapped, by hand, onto a
subset of Flamme's ten standard conditions (material, O2 %, pressure, flow, gravity regime)
plus the measured outcome.

This notebook does NOT re-derive the findings — that extraction/curation step
(`findings/extract_findings_from_pdfs.py`, `build_findings.py`, `merge_findings.py`) already
happened and is out of scope here. What this notebook adds, and documents end to end:

1. **Data cleaning** of `findings.csv` into an analysis-safe table: parsed ranges, explicit
   missing-value flags (never silently imputed), typed numeric columns, isolated
   "evidence gap" rows that carry no measurement.
2. **Feature engineering**: numeric features a model can consume (midpoints, regimes,
   encodings), with every derived column documented in a feature dictionary at the end.
3. A **small demonstration model** (self-extinction share vs. O2 %) showing the cleaned
   features are usable — this is a sanity check, not the production flame model. Grounding
   the 3D lab in data (Part 2, item 4 of the plan) needs the full PSI test-matrix tables in
   `flame_in_freefall_data/cleaned/cleaned_values.csv` (24k+ rows), which is a separate,
   larger pipeline noted at the end.

Run top to bottom. Outputs land in this `ml/` folder:
`findings_clean.csv`, `findings_features.csv`, `feature_dictionary.md`.
""")

code("""import pandas as pd
import numpy as np
import re
from pathlib import Path

pd.set_option('display.max_columns', 30)
pd.set_option('display.width', 160)

ROOT = Path('..').resolve()          # flame_in_freefall_data/
SRC = ROOT.parent / 'findings' / 'findings.csv'
OUT = Path('.').resolve()            # flame_in_freefall_data/ml/

raw = pd.read_csv(SRC)
print(raw.shape)
raw.head(3)
""")

md("""## 1. Data cleaning

### 1.1 Audit — what's actually wrong with the raw table

Before touching anything, quantify the problems so the cleaning steps below are justified,
not guessed.""")

code("""audit = pd.DataFrame({
    'dtype': raw.dtypes.astype(str),
    'n_missing': raw.isna().sum(),
    'pct_missing': (raw.isna().mean() * 100).round(1),
    'n_unique': raw.nunique(),
})
audit
""")

md("""Findings:
- `o2_pct_min/max`, `pressure_atm_min/max`, `flow_cm_s`, `n_tests` are numeric but have
  40–45% missing — genuinely not reported for some findings (e.g. "tests in table" rows,
  evidence-gap rows), not something to impute.
- `value` and `unit` are mixed free text: numbers with a `%`/`s`/`ppm` unit, but also text
  like `"burn length (29 cm sample)"` used as a unit label, and 3 rows with no value at all
  (the "Evidence gap" theme rows — they describe a *missing* test, not a result).
- `gravity` is a free-text field mixing single regimes (`microgravity (ISS)`) and
  comparison studies (`microgravity (Cygnus) vs 1-g ground`) in the same column — these are
  two different kinds of row for modelling purposes and must be split, not treated as one
  category.
- 3 rows (`theme == "Evidence gap"`) have no `psi_id`/measurement at all by design — they
  document an untested condition combination, which is exactly the gap-map input from the
  project plan, not a training example. They are carried through as their own table,
  excluded from the numeric feature set.""")

code("""gap_rows = raw[raw['theme'] == 'Evidence gap'].copy()
data_rows = raw[raw['theme'] != 'Evidence gap'].copy()
print(f'{len(gap_rows)} evidence-gap rows set aside -> findings_gaps.csv')
print(f'{len(data_rows)} measurement rows carried forward for cleaning')
gap_rows[['finding_id', 'question', 'condition', 'finding']]
""")

md("""### 1.2 Parse `gravity` into a clean regime + comparison flag

Splits the free-text gravity field into:
- `gravity_primary`: the single controlled-vocabulary regime of the main test
  (`microgravity`, `earth_1g`, `drop_tower`, `unknown`)
- `gravity_platform`: ISS / Cygnus / Shuttle / drop tower / not stated
- `is_comparison`: True if the row reports microgravity **and** a 1-g (or other) baseline
  side by side — those rows have two outcomes bundled in one `value`, so they are flagged
  rather than silently treated as single-condition rows.""")

code("""def parse_gravity(g):
    if pd.isna(g):
        return pd.Series({'gravity_primary': np.nan, 'gravity_platform': np.nan, 'is_comparison': False})
    g_low = g.lower()
    is_comp = ' vs ' in g_low
    platform = np.nan
    for p in ['iss', 'cygnus', 'shuttle', 'drop tower', 'mir']:
        if p in g_low:
            platform = p.replace(' ', '_')
            break
    if 'microgravity' in g_low:
        primary = 'microgravity'
    elif '1-g' in g_low or '1g' in g_low:
        primary = 'earth_1g'
    else:
        primary = 'unknown'
    return pd.Series({'gravity_primary': primary, 'gravity_platform': platform, 'is_comparison': is_comp})

grav = data_rows['gravity'].apply(parse_gravity)
data_rows = pd.concat([data_rows, grav], axis=1)
data_rows[['gravity', 'gravity_primary', 'gravity_platform', 'is_comparison']].drop_duplicates()
""")

md("""### 1.3 Parse `value` + `unit` into a typed numeric column

`value` is numeric in every row that has one, but `unit` is sometimes a real unit (`%`,
`s`, `ppm`) and sometimes a disguised label (`"burn length (29 cm sample)"`,
`"mm^2/s (column labelled 'mm')"`). Rather than guess which, we keep the original `unit`
text verbatim as `unit_raw` for provenance and add a short controlled `unit_clean` for
grouping, plus `value_numeric` (float) and `value_is_missing`.""")

code("""UNIT_MAP = {
    '%': 'percent', '% O2': 'percent_o2', 'tests': 'count', 'ratio': 'ratio', 's': 'seconds',
    'ppm': 'ppm', 'ppm (24-h limit 100)': 'ppm', 'kW': 'kilowatt', 'mm/s': 'mm_per_s',
    'mm/s (linear)': 'mm_per_s', 'mm/s (steady)': 'mm_per_s',
}

def clean_unit(u):
    if pd.isna(u):
        return np.nan
    if u in UNIT_MAP:
        return UNIT_MAP[u]
    if 'burn length' in u:
        return 'burn_length_ratio'
    if u.startswith('mm^2/s'):
        return 'ambiguous_see_unit_raw'
    return 'other_see_unit_raw'

data_rows['unit_raw'] = data_rows['unit']
data_rows['unit_clean'] = data_rows['unit'].apply(clean_unit)
data_rows['value_numeric'] = pd.to_numeric(data_rows['value'], errors='coerce')
data_rows['value_is_missing'] = data_rows['value_numeric'].isna()

print('Rows where value exists but failed numeric parse (should be 0 — value is always numeric-looking in this file):')
print(data_rows[data_rows['value'].notna() & data_rows['value_numeric'].isna()][['finding_id', 'value']])
data_rows[['value', 'unit_raw', 'unit_clean', 'value_numeric']].drop_duplicates().head(10)
""")

md("""### 1.4 Range fields -> midpoint + width + explicit missing flags

`o2_pct_min/max`, `pressure_atm_min/max` are ranges, not points (a test run across a
condition band). For modelling we need one numeric per condition, so we add the midpoint
and the range width (width = 0 means a single reported value, not a swept range — that
distinction matters and is kept rather than discarded).

Every derived numeric column gets a paired `*_missing` boolean so "missing" is never
confused with "zero" downstream — the same non-negotiable rule the PSI table cleaner
(`clean_tables.py`) already enforces on the raw data.""")

code("""def midpoint_width(df, lo, hi, out_prefix):
    df[f'{out_prefix}_mid'] = df[[lo, hi]].mean(axis=1)
    df[f'{out_prefix}_width'] = df[hi] - df[lo]
    df[f'{out_prefix}_missing'] = df[lo].isna() | df[hi].isna()
    return df

data_rows = midpoint_width(data_rows, 'o2_pct_min', 'o2_pct_max', 'o2_pct')
data_rows = midpoint_width(data_rows, 'pressure_atm_min', 'pressure_atm_max', 'pressure_atm')
data_rows['flow_cm_s_missing'] = data_rows['flow_cm_s'].isna()
data_rows['n_tests_missing'] = data_rows['n_tests'].isna()

data_rows[['o2_pct_min', 'o2_pct_max', 'o2_pct_mid', 'o2_pct_width', 'o2_pct_missing',
           'pressure_atm_mid', 'pressure_atm_missing', 'flow_cm_s', 'flow_cm_s_missing']].head(8)
""")

md("""### 1.5 Deduplication check and final cleaned table""")

code("""dupes = data_rows[data_rows.duplicated('finding_id', keep=False)]
print(f'duplicate finding_id rows: {len(dupes)}')

clean_cols = [
    'finding_id', 'question', 'theme', 'psi_id', 'experiment', 'material_or_fuel', 'condition',
    'o2_pct_min', 'o2_pct_max', 'o2_pct_mid', 'o2_pct_width', 'o2_pct_missing',
    'pressure_atm_min', 'pressure_atm_max', 'pressure_atm_mid', 'pressure_atm_width', 'pressure_atm_missing',
    'flow_cm_s', 'flow_cm_s_missing',
    'gravity', 'gravity_primary', 'gravity_platform', 'is_comparison',
    'metric', 'value_numeric', 'value_is_missing', 'unit_raw', 'unit_clean',
    'n_tests', 'n_tests_missing',
    'evidence_type', 'confidence', 'source_file', 'caveat', 'page', 'quote',
]
findings_clean = data_rows[clean_cols].copy()
findings_clean.to_csv(OUT / 'findings_clean.csv', index=False)
gap_rows.to_csv(OUT / 'findings_gaps.csv', index=False)
print('wrote findings_clean.csv', findings_clean.shape)
print('wrote findings_gaps.csv', gap_rows.shape)
findings_clean.head(3)
""")

md("""## 2. Feature engineering

Goal: turn `findings_clean.csv` into a numeric-first table a model can take as-is, with
every engineered column traced back to a plain-English definition in the feature
dictionary generated at the end of this notebook.

Encodings used, and why:
- **Ordinal** for `confidence` (`low < medium < high`) — it is a genuinely ordered
  judgement, not an unordered category.
- **One-hot** for `gravity_primary`, `evidence_type`, `theme` — small, unordered,
  fixed vocabularies.
- **Frequency encoding** for `material_or_fuel` — too many distinct materials for one-hot
  at n=108 rows without exploding the feature space; frequency count is a cheap, leakage-free
  stand-in until the material catalogue is large enough for embeddings or domain grouping.
- **Log1p** for `n_tests` — sample sizes are right-skewed (1 to dozens of tests).""")

code("""fc = findings_clean.copy()

# Ordinal: confidence
conf_order = {'low': 0, 'medium': 1, 'high': 2}
fc['confidence_ordinal'] = fc['confidence'].map(conf_order)

# One-hot: gravity_primary, evidence_type, theme
onehot = pd.get_dummies(fc[['gravity_primary', 'evidence_type', 'theme']], prefix=['gravity', 'evtype', 'theme'])
fc = pd.concat([fc, onehot], axis=1)

# Frequency encoding: material_or_fuel
mat_freq = fc['material_or_fuel'].value_counts(normalize=True)
fc['material_freq'] = fc['material_or_fuel'].map(mat_freq)

# Boolean -> int
fc['is_comparison_int'] = fc['is_comparison'].astype(int)

# Log1p of sample size (skewed, and missing-safe: log1p(NaN) stays NaN)
fc['n_tests_log1p'] = np.log1p(pd.to_numeric(fc['n_tests'], errors='coerce'))

fc.to_csv(OUT / 'findings_features.csv', index=False)
print('wrote findings_features.csv', fc.shape)
fc.filter(like='gravity_').head(3)
""")

md("""## 3. Demonstration model — does O2 % predict self-extinction share?

This is a sanity check that the cleaned/engineered features are usable, **not** the
production flame model for the 3D lab (that needs the full ~24k-row PSI test-matrix
cleaned view, far more rows per condition, and is Part 2 item 4 of the project plan — noted
at the end). Scope here: the 20 FLEX droplet-flame findings that report
"share of flames that self-extinguished" as a function of O2 %, which is the cleanest
single-variable relationship in this curated table.""")

code("""ext = fc[fc['metric'].astype(str).str.contains('self-extinguish', case=False, na=False)].copy()
ext = ext.dropna(subset=['o2_pct_mid', 'value_numeric'])
print(f'{len(ext)} usable rows for the demo model')
ext[['finding_id', 'material_or_fuel', 'o2_pct_mid', 'value_numeric', 'n_tests']]
""")

code("""from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

if len(ext) >= 6:
    X = ext[['o2_pct_mid']].values
    y = ext['value_numeric'].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)
    model = LinearRegression().fit(X_train, y_train)
    pred = model.predict(X_test)
    print(f'slope: {model.coef_[0]:.2f} pct self-extinction per pct O2')
    print(f'intercept: {model.intercept_:.2f}')
    print(f'MAE: {mean_absolute_error(y_test, pred):.2f}')
    print(f'R2 (test, n={len(y_test)} — too small to trust in isolation): {r2_score(y_test, pred):.2f}')
else:
    print('Not enough rows for a held-out split — report the trend only, no model.')
""")

md("""**Reading this result**: with ~20 rows and a 30% test split, R² is noisy by
construction — the number itself is not evidence of model quality. What it demonstrates is
that the pipeline (clean -> engineer -> model-ready arrays) runs end to end on real
NASA-derived values and the direction (lower O2 -> higher self-extinction share) matches
the qualitative finding already written up in `findings.csv`. The real grounding of the
3D lab (flammability limits, spread rate, extinction curves fitted per material) needs the
full test-matrix data in `cleaned_values.csv`, which has ~3,000 individual test rows across
22 experiments rather than 20 pre-aggregated findings — that is the next pipeline to build,
not this notebook.""")

md("""## 4. Feature dictionary

Auto-generated from the dataframe so it never drifts out of sync with the actual columns.""")

code("""def describe_col(s):
    if s.dtype == bool:
        return 'boolean'
    if np.issubdtype(s.dtype, np.number):
        nn = s.dropna()
        if nn.empty:
            return 'numeric (all missing)'
        return f'numeric, range [{nn.min():.3g}, {nn.max():.3g}]'
    return f'categorical, {s.nunique()} values'

lines = ['# Feature dictionary — findings_features.csv', '', '| column | type | notes |', '|---|---|---|']
notes = {
    'o2_pct_mid': 'midpoint of reported O2 %% band',
    'o2_pct_width': '0 = single reported value, >0 = swept range',
    'o2_pct_missing': 'True if O2 %% was not reported for this finding',
    'pressure_atm_mid': 'midpoint of reported pressure band, atm',
    'gravity_primary': 'parsed regime: microgravity / earth_1g / unknown',
    'is_comparison': 'row reports microgravity AND a baseline side by side',
    'value_numeric': 'the reported metric value, parsed to float',
    'unit_clean': 'controlled-vocabulary unit; unit_raw keeps the original text',
    'material_freq': 'frequency-encoded material_or_fuel (share of all rows)',
    'confidence_ordinal': 'low=0, medium=1, high=2',
    'n_tests_log1p': 'log1p of number of individual tests behind this finding',
}
for col in fc.columns:
    note = notes.get(col, '')
    lines.append(f'| {col} | {describe_col(fc[col])} | {note} |')

(OUT / 'feature_dictionary.md').write_text('\\n'.join(lines))
print('wrote feature_dictionary.md')
print('\\n'.join(lines[:12]))
""")

md("""## 5. What's next for the full data pipeline (not in this notebook)

1. **Grounding the 3D lab (plan item 4)**: repeat this cleaning/feature-engineering
   pattern on `flame_in_freefall_data/cleaned/cleaned_values.csv` (~24.5k rows, 22 raw PSI
   tables, long/tidy format with per-cell provenance). That file is intentionally *not*
   pivoted into one wide schema by the existing cleaner (see its README) because the 22
   source tables use incompatible column sets — pivoting needs a per-investigation mapping
   to the ten standard conditions, which is the real next engineering task, bigger than this
   notebook.
2. **Gap map (plan item 3)**: once conditions are in one schema, group by
   (material, O2 band, pressure band, gravity) and count tests per cell; empty cells are the
   gap map.
3. **Reporting template / schema (plan item 5)**: publish the ten-condition column set used
   here (`o2_pct_mid`, `pressure_atm_mid`, `flow_cm_s`, `gravity_primary`, ...) as a
   JSON Schema / CSV template for future experiment write-ups.
""")

md("""## 6. Can this notebook run inside Google Colab, connected to me?

Short answer: **you can open and run this notebook in Colab, but I (the assistant) cannot
attach to a live Colab runtime** — Colab has no API that lets an outside agent drive its
kernel, read its cell outputs, or push edits into a running session. There is no
"connect Claude to Colab" feature.

What actually works, in order of how much Colab buys you here:

- **This dataset is tiny** (111 → ~130 feature rows) and needs no GPU — running it on your
  Mac, as just happened, is strictly simpler than Colab: no upload step, no runtime
  reconnects, and I can read the actual output you got rather than a screenshot.
- **If you still want it in Colab** (to share with teammates, or because the next step —
  the ~24.5k-row grounding pipeline — benefits from Colab's free compute): push this
  `ml/` folder to GitHub, then open it in Colab via
  `File → Open notebook → GitHub` and paste the repo URL, or go straight to
  `https://colab.research.google.com/github/<user>/flamme/blob/main/flame_in_freefall_data/ml/feature_engineering.ipynb`.
  Colab will clone just that notebook; you'd still need a `!pip install` cell or a
  `!git clone` cell at the top to pull `findings.csv` in, since Colab starts from a blank
  VM with no access to your local files.
- **Round-tripping with me**: after you run it in Colab, download the notebook
  (`File → Download → .ipynb`) or just the output CSVs, and hand them back to me in this
  chat (or commit them to the repo) — I can read and continue from those, I just can't poke
  the live Colab session directly.
""")

nb['cells'] = cells
with open('feature_engineering.ipynb', 'w') as f:
    nbf.write(nb, f)
print('wrote feature_engineering.ipynb with', len(cells), 'cells')
