# Flamme

Flamme is a source-linked evidence platform for the **Flame in Freefall: AI-Powered Fire
Safety Insights from Microgravity Combustion Data** NASA Space Apps 2026 challenge. It lets
anyone describe a microgravity flame experiment in ten standard conditions, search and
compare real NASA PSI/NTRS records against those conditions, see where the evidence has
gaps, and run a real model — trained on actual NASA test data — grounding part of the
interactive 3D flame lab.

Built by **Team Flamme**, University of Dhaka. Not a NASA product, not NASA-endorsed, and
must not be used to certify a material, predict a spacecraft fire, or make an operational
safety decision.

**Live:** https://www.flammelab.me · **Source:** this repository

## The problem

NASA microgravity-combustion evidence is scattered across drop towers, parabolic flights,
ISS experiments (FLEX, BASS) and the Saffire tests on Cygnus. Each source records its test
conditions differently — one gives oxygen as a percentage but not pressure, another omits
airflow direction — so two results can't be fairly compared, and it's hard to tell which
conditions have been tested, which haven't, and why one material burns while another self-
extinguishes.

## What's implemented

| Page | What it does |
|---|---|
| **Lab** (`/lab`, `/lab/view`) | Interactive 3D chamber with a hand-built illustrative flame-response model (`src/labModel.js`), plus a **"Grounded in NASA FLEX data"** card (liquid droplets) and a **"Grounded in NASA CFI-G data"** card (gaseous fuels, normal and inverse flames up to 85% O₂), each driven by a real trained model (see [Machine learning](#machine-learning) below) — shown side by side, never blended. |
| **Evidence** (`/evidence`) | Search/filter over 5 curated, fully source-traced sample records (Saffire II, BASS II) with explicit provenance (file, row, DOI, caveats). |
| **Ask** (`/ask`) | Plain-language questions about microgravity fire safety. **Ask Flame** uses a deterministic keyword/regex parser (no AI). **Interpret with SI** sends the question to an LLM that reads it into conditions, then writes a short answer grounded only in the top-ranked findings (see [The SI layer](#the-si-layer)); if the SI service is unavailable or rate-limited the page falls back to the keyword parser and says so. |
| **Rankings** (`/rankings`) | Scores all 115 findings in the full catalog against a chosen crew environment (ISS, transit, Moon, Mars), same formula as `findings/rank_findings.py`. Filter by theme or by **Controls & equipment** (Detection, Suppression, Ventilation & airflow, Atmosphere & life support — tagged from each finding's text by fixed patterns in `src/ranking.js`); export CSV/JSON. |
| **Investigations** (`/investigations`) | Browse and compare up to 4 of the full 24-investigation NASA PSI/NTRS catalog side by side. Each investigation with a PSI test table has a **What varied between tests** panel (conditions that varied vs. were held the same, computed from `cleaned_values.csv` by `findings/build_variation.py`); 4 investigations have no test table. |
| **Gap map** (`/gaps`) | Heatmap of which gravity-regime × oxygen-band combinations the 115-finding catalog's experiments actually cover vs. don't (real-incident lessons are excluded from coverage) — plan item "map the gaps." |
| **Model** (`/model`) | The exact fitted parameters (coefficients, confusion matrix, held-out metrics) of the trained FLEX model, plus the ten-condition reporting schema (downloadable JSON Schema + CSV template) every page's data follows, so the "grounded" claim in the Lab is independently checkable. |
| **Sources** (`/sources`) | Every NASA source Flamme cites, in one place: the 24 PSI investigations plus the 20 NTRS technical reports quoted by Rankings findings (Apollo 1, Apollo 13 and Mir reports marked as real-incident lessons). |

## Machine learning

Everything here is in [`ML/`](ML/) — small, fully documented, re-runnable pipelines: the FLEX model (sections 1–7 below), a CFI-G hot-ignition model (`ML/build_cfig_model.py`, see [`ML/README.md`](ML/README.md) §3; held-out AUC 0.83 but no better than always guessing "ignites" on accuracy), and a findings notebook.
Pushed to the browser as plain coefficients (no backend, no `.pkl`, nothing to load at
request time): the model trains once offline in Python, and the browser only runs the
already-fitted arithmetic (standardize → dot product → sigmoid). See `src/flexModel.js`
for that inference code and [`ML/README.md`](ML/README.md) for the full write-up.

### 1. Data

Source: NASA PSI investigation **PSI-69 (FLEX)** — Fiber-supported Liquid-fuel/free
Droplet combustion Experiment — one of 22 raw PSI test-matrix tables already pivoted into a
single long/tidy export (`flame_in_freefall_data/cleaned/cleaned_values.csv`, ~24,500 rows,
provenance-preserving: every cell keeps its source file/row). FLEX contributes **274
individual droplet-flame tests** (methanol and heptane droplets burned across a swept O₂/
pressure/diluent-gas test matrix) — the richest row-level, numeric source in the catalog,
and the only one dense enough to fit a model on with an honest held-out test split.

**Data shape going in**: 1 long-format table, ~24,500 rows × 16 columns
(`record_id, psi_id, source_file, source_row, column_key, raw_value, normalized_value,
value_type, status, ...`) — one row per (test, reported field).

**Data shape after pivoting** (`ML/build_flex_model.py`, step 1): 274 rows × 10 columns,
one row per test: `fuel, o2_frac, n2_frac, co2_frac, he_frac, pressure_mmhg,
droplet_diameter_mm, burn_time_s, burning_rate_mm, extinction_diameter_mm` (+ raw/type
companion columns kept for provenance). One row is later dropped for a bad pressure reading
(below), leaving 273 usable for nearest-test lookup and modeling.

### 2. Cleaning

- **Unit conversion**: ambient pressure `mmHg → atm`; O₂/N₂/He mole fractions `→ percent`.
- **Target derivation, not assumption**: `self_extinguished` = 1 if the source reports a
  numeric extinction diameter (flame went out before the droplet burned out), 0 if the
  source explicitly marks no early extinction (a literal `–`), and **left as missing** —
  excluded from training, not guessed — when the column wasn't reported for that test at
  all (49 of 274 rows).
- **Caught a real data-quality bug**: one row had a literal `0 mmHg` ambient-pressure
  reading — physically impossible for a sealed test chamber (it isn't a vacuum). Treated as
  missing rather than a valid near-vacuum test. Fixing this single bad row improved the
  burning-rate regression's R² from 0.45 to 0.58 — concrete evidence the cleaning step
  mattered, not cosmetic.
- **Explicit `*_missing` flags** paired with every numeric column, so "not reported" is
  never silently read as zero.

Output: `ML/flex_tests_clean.csv` (274 rows), `ML/flex_feature_dictionary.md` (column
reference, auto-generated so it can't drift out of sync with the code).

### 3. Feature engineering

| Feature | Why |
|---|---|
| `o2_pct` | The primary driver of flammability — direct oxidizer availability. |
| `pressure_atm` | Total ambient pressure; affects flame temperature and mass-transfer rate. |
| `o2_partial_pressure_atm` (= `o2_frac × pressure_atm`) | A derived, physically meaningful term — combustion literature cares about oxidizer *partial pressure*, not O₂% and total pressure independently; this single feature lets a linear model capture that interaction without needing an explicit cross-term. |
| `droplet_diameter_mm` | Governs the d²-law burning-rate relationship (classic droplet-combustion theory) and total fuel available before burnout. |
| `fuel_methanol` (binary: methanol vs heptane) | The two fuels have different flame chemistry and sooting behavior; a binary flag lets the small feature set distinguish them without one-hot blowing up the parameter count at n=273. |

Standardization (zero mean, unit variance) is fit once on the training split and reused —
the exact `scaler_mean`/`scaler_scale` are published in `src/flexModel.json` and rendered on
the `/model` page.

### 4. Algorithm and why

Two models, both intentionally simple:

- **Logistic regression** → P(self-extinguish). Chosen because: n=273 (222 after dropping
  missing-target rows) is far too small for anything with more capacity (tree ensembles,
  neural nets) to generalize honestly; coefficients are directly interpretable (sign and
  magnitude per feature, shown on `/model`); and the Lab needs a *calibrated probability*,
  which logistic regression gives natively.
- **Linear regression** → burning-rate constant K. Same reasoning, plus K is a continuous
  physical quantity (mm²/s) with a roughly linear dependence on these standardized features
  in the d²-law regime FLEX tests.

No gradient boosting, no deep learning — a bigger model on 273 rows would mostly be fitting
noise, and an uninterpretable model would fail the "show your training data, features, and
an honest accuracy figure" bar this challenge is explicitly judged on.

### 5. Training and validation

- 75/25 train/test split (`random_state=0`, stratified for the classifier so both classes
  appear in the test set despite the 88%/12% imbalance).
- **Classifier**: 166 train / 56 test. Test accuracy 88%, but the base rate is already 88%
  self-extinguish — so accuracy alone is not informative, which is why **test AUC = 0.895**
  is the number actually reported in the UI: it shows real separation between the two
  outcomes, not just majority-class prediction.
- **Regressor**: 192 train / 65 test. Test **R² = 0.582**, MAE = 0.068 mm²/s.
- **Never extrapolate silently**: the min/max of every feature actually seen in training is
  recorded (`training_range` in `flexModel.json`). At inference, a scenario outside that
  envelope gets no prediction at all — the Lab shows an explicit "outside the tested
  envelope" message instead of guessing (verified: pushing O₂ to 40%, outside FLEX's tested
  12–34%, correctly blocks the prediction).
- Every prediction also surfaces the single closest real FLEX test by feature distance,
  with a link to its NASA PSI source — the "closest real experiment next to the simulation"
  the challenge brief asks for.

### 6. Where it's reproducible

```sh
cd ML
python3 build_flex_model.py        # re-pivots, re-cleans, re-fits, re-exports
```

Re-running it regenerates `src/flexModel.json` from scratch and will reproduce the same
metrics reported above and on `/model`.

### 7. Honest scope

FLEX is **free-floating liquid-droplet combustion** (methanol/heptane droplets burning in
air) — a different physical regime from the Lab's illustrative solid-sample model
(SIBAL/PMMA/silicone sheets, `src/labModel.js`). That's why the trained model is wired in as
a clearly labelled, separate card rather than replacing the solid-sample curves — doing
that would misrepresent the physics. Grounding the solid-sample model itself would need the
same pipeline applied to BASS/BASS-II/Saffire row-level data instead — not done here, and
explicitly flagged as the natural next step in `ML/README.md`.

A second pipeline, `ML/build_notebook.py` → `ML/feature_engineering.ipynb`, applies the same
cleaning/feature-engineering discipline to the curated `findings.csv` (111 rows when the notebook was last run; used by
Rankings/Gap map), independently of the FLEX model above.

## The SI layer

"SI" here means a language model used for two narrow jobs, behind one serverless endpoint
(`api/ask.js`, Vercel; Groq's OpenAI-compatible API, model `openai/gpt-oss-120b` by default):

1. **parse** — turn a free-text question into scenario fields (material, O₂, airflow, direction, pressure, gravity) and flag out-of-scope questions (e.g. rocket propellants).
2. **interpret** — Flamme ranks the 115 findings for that scenario (`src/ranking.js`) and sends **only the top 5 rows plus known evidence gaps**. The model must answer from those rows and cite their IDs; the browser drops any citation that was not among the rows it sent (`src/ai.js`).

The ranking, the data and every number shown come from the deterministic pipeline, not the model. If
the endpoint is down, unconfigured or rate-limited (30 requests per IP per 10 minutes, plus a
10-minute cache of identical requests; in-memory, so per serverless instance), Ask falls back to the keyword parser.
The SI answer is a summary of NASA findings, not a safety assessment.

Setup: put `GROQ_API_KEY` in a local `.env` (gitignored) and in Vercel → Environment Variables
(Production). `npm run dev` also serves `/api/ask` locally (see `vite.config.js`); `node scripts/test-ask.mjs`
calls it without a browser. Optional `GROQ_MODEL` overrides the model.

## Challenge coverage

How the build maps onto the *Flame in Freefall* brief (see the NASA Space Apps challenge page for the full text):

| Brief asks for | Where in Flamme |
|---|---|
| Summarise and organise the microgravity combustion data | Investigations, Sources, Evidence, `findings/` pipeline |
| Compare tests within an investigation: what varied, what stayed the same | Investigations → *What varied between tests* |
| Rank / prioritise findings for fire safety | Rankings (crew environment, weights, export) |
| Interpret results with AI | Ask → *Interpret with SI*, grounded and cited |
| Exploration atmospheres (e.g. Moon-base 30% O₂ / 10.2 psi) | Rankings scenario presets; Gap map; Lab |
| Highest-oxygen and ignition behaviour | CFI-G model incl. inverse flames to 85% O₂ (Lab, Model) |
| Research informing next-generation controls and equipment | Rankings → *Controls & equipment* |
| Where evidence is missing | Gap map; evidence-gap notices in Rankings and Ask |
| Earth applications of the research | Landing page ("Fire safety on Earth, too"), Gap map detector link |

## How evidence is represented

Every record separates four concepts so the interface never invents precision the source
doesn't have:

- **Source value** — the original string as reported.
- **Normalized value** — a numeric/canonical value, only when normalization is defensible.
- **Status** — reported, approximate, qualitative, ambiguous, not reported, or not applicable.
- **Provenance** — investigation, source file, source row, DOI, notes.

Example: Saffire II sample 2-5's thickness string `037 mm` is retained as ambiguous and
excluded from numeric matching rather than silently parsed as `0.37mm`.

## Repository structure

```text
.
├── src/                       React app (Vite)
│   ├── pages/                 One file per route: Lab, Evidence, Ask, Rankings,
│   │                          Investigations, Gaps, Model, Sources
│   ├── ai.js                  Client for the SI layer (grounded, citation-checked)
│   ├── cfigModel.js/.json     CFI-G hot-ignition model (normal + inverse flames)
│   ├── variationData.json     What varied/held constant per investigation (generated)
│   ├── labModel.js            Illustrative solid-sample flame-response model
│   ├── flexModel.js           Client-side inference for the trained FLEX model
│   ├── flexModel.json         Exported model parameters (generated by ML/)
│   ├── science.js             Deterministic 5-row matching/explanation logic
│   └── ranking.js             JS port of findings/rank_findings.py
├── api/ask.js                 Serverless SI endpoint (Groq), rate-limited
├── ML/                        Data cleaning + feature engineering + model training
│   ├── build_flex_model.py    FLEX pipeline → src/flexModel.json
│   ├── build_cfig_model.py    CFI-G pipeline → src/cfigModel.json
│   ├── build_notebook.py      Generates feature_engineering.ipynb
│   └── README.md              Full pipeline write-up
├── flame_in_freefall_data/    PSI/NTRS catalog, manifests, downloaded tables, reports
├── findings/                  Finding extraction, normalization, ranking pipeline
├── parameter_catalog/         Editable ten-condition parameter reference + PDF generator
├── package.json
└── vite.config.js
```

## Local development

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # node:test (src/science.test.js)
npm run build         # production build
npm run preview
```

Python tooling (data pipelines, `ML/`) needs Python 3 with `pandas`, `numpy`,
`scikit-learn` (`pip install pandas numpy scikit-learn jupyter nbformat`).

## SI (Super Intelligence) use disclosure

Per the NASA Space Apps SI-use rules, here is where SI tools were used:

- **Code:** Claude (Anthropic) helped write and edit the React app, the SI endpoint (`api/ask.js`), the ranking and model code in `src/`, and the Python pipelines in `ML/` and `findings/`. Key files carry an "SI disclosure" header.
- **Data:** Claude helped write the scripts that clean, reshape and summarise the NASA PSI tables (`findings/build_variation.py`, `ML/build_cfig_model.py`, the findings build). Which columns count as test conditions (`findings/variation_config.py`) was curated by the team. Generated files (`src/variationData.json`, `src/cfigModel.json`) are produced by those scripts.
- **Text:** Claude helped draft the README, in-app copy and the video script. The team reviewed it.
- **SI inside the product:** the Ask page's "Interpret with SI" feature calls a language model (`openai/gpt-oss-120b` via Groq) at runtime. It only summarises the top-ranked findings it is given and cites them; ranking, data and numbers are deterministic.
- **Images, video, audio:** no SI-generated images, video or audio are included. No NASA logos, flags or mission identifiers are used; NASA is credited as a data source in text only.

## Limitations and responsible-use boundaries

- SI answers are only as good as the five findings they are given, and the language model can still
  phrase them imperfectly; every point is shown with its cited NASA source so it can be checked.
- The CFI-G model covers gaseous fuels only and does not beat the majority guess on accuracy;
  inverse-flame O₂ is the oxidiser-stream concentration, not a cabin atmosphere.
- Some PSI tables are test logs or planned matrices without measured outcomes; the *What varied* panel says so.

- The Evidence demo covers 5 curated records; Rankings/Investigations/Gap map cover
  the full 115-finding catalog, which is itself a curated subset of the ~24,500-row raw PSI
  export.
- Four catalog rows are real-incident lessons from the Apollo 1 (1967) and Apollo 13 (1970)
  review board reports, alongside the existing Mir (1997) row. They are not controlled
  experiments: they appear in Rankings, are excluded from Gap-map coverage, and are not
  used to fit any model.
- The Lab's solid-sample flame response is illustrative, not fitted to data — only the
  separate FLEX card is a trained model, and only within its tested envelope.
- The FLEX model's n=274 (222–257 after dropping missing targets) is honestly small;
  metrics are reported with that context rather than presented as more certain than they are.
- Report-derived findings require verification against their cited source pages.
- No backend, authentication, database, or live AI service is implemented — everything
  ships as a static site.

## Source domains

- [NASA Physical Sciences Informatics](https://psi.nasa.gov/)
- [NASA Technical Reports Server](https://ntrs.nasa.gov/)

NASA names, investigation identifiers, and links are used for source attribution only;
this prototype and Team Flamme remain separate from NASA's identity.
