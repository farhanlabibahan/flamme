# Fire Navigator

Fire Navigator is a source-linked concept prototype for the **Flame in Freefall: AI-Powered Fire Safety Insights from Microgravity Combustion Data** challenge. It explores how researchers and students could find comparable NASA combustion experiments, inspect the conditions behind each observation, and trace a displayed result back to its source.

The project is developed by **Team Flamme**. It is not a NASA product, is not NASA-endorsed, and must not be used to certify a material, predict a spacecraft fire, or make an operational safety decision.

## The problem

NASA microgravity-combustion evidence is distributed across experimental tables, technical reports, analyzed files, imagery, and investigation pages. The same physical concept may be described with different names or units, and important conditions are often missing or reported only qualitatively.

That creates three practical difficulties:

1. Finding experiments relevant to a specific material, atmosphere, geometry, or airflow condition.
2. Comparing records without hiding differences or treating missing values as equivalent.
3. Turning observations into understandable conclusions without losing provenance, uncertainty, or scientific limitations.

Fire Navigator treats those as an evidence-management problem before treating them as an intelligence problem.

## Solution in one view

The implemented prototype follows this path:

```text
Research question
    → controlled conditions
    → transparent similarity matching
    → source-linked observation
    → qualified comparison
    → original NASA investigation, DOI, file, and row
```

The planned system extends that foundation with Machine Learning, constrained AI reasoning, and structured Agentic Memory:

```text
Reviewed records
    → normalized variables and provenance
    → physics-aware features
    → trained and cross-validated ML models
    → uncertainty-aware inference
    → explainability and applicability checks
    → AI constraint review
    → versioned experiment memory
    → Observed / Predicted / Unknown report
```

This proposed architecture is **not a RAG implementation**. Source traceability remains mandatory, but the planned intelligence path is based on trained models, explicit scientific constraints, calibrated uncertainty, and persistent structured memory.

## Current implementation status

| Area | Current state |
|---|---|
| Evidence explorer | Implemented in React; searches and compares five curated source-table rows. |
| Condition matching | Implemented as deterministic, inspectable rules in `src/science.js`. |
| Evidence explanations | Implemented as deterministic templates; clearly labelled rule-based. |
| Source trace | Implemented for NASA PSI investigation pages, DOI, local CSV filename, and row number. |
| Interactive Flame Lab | Implemented with React and Three.js as a qualitative visual model. |
| Guided demonstration | Implemented as a five-step path through question, conditions, chamber, evidence, and comparison. |
| Wider research catalog | Collected locally, but not fully integrated into the React interface. |
| Findings pipeline | Implemented separately in Python; produces findings and mission-scenario rankings. |
| Machine-learning model | Planned; no trained model is currently executed by the app. |
| Generative AI reasoning | Planned; no live AI service or model call is present. |
| Agentic memory | Planned; no persistent memory service is present. |
| Measured flame media | Not bundled. |
| Validated combustion or CFD prediction | Not implemented. |

### Verified React demo scope

The active interface bundles five curated records from two investigations:

- **Saffire II / PSI-99:** samples 2-1, 2-2, 2-3, and 2-5.
- **BASS II / PSI-25:** test B1.

These rows support a focused prescreening demonstration. They are not sufficient to train or validate a reliable general-purpose ML model.

### Wider local research snapshot

The repository also contains a broader data catalog harvested on 2026-10-01:

- 24 PSI combustion investigations.
- 22 experimental-table references and 24 downloaded table files.
- Approximately 3,000 experimental-table rows across the catalog.
- 765 non-raw PSI files in the curated manifest.
- 40 selected NTRS report records and 36 locally downloaded PDFs.
- 111 normalized finding rows.
- Rankings for four mission scenarios.

These counts describe the current repository snapshot, not the number of records currently searchable in the React app.

## Demonstration workflow

The intended prototype story follows one research question from conditions to evidence:

1. Start the guided demo.
2. Ask which records are relevant to cotton–fiberglass SIBAL at approximately 22.1% oxygen and 20 cm/s airflow.
3. Inspect the selected material, oxygen, flow, and other reported or unavailable conditions.
4. Use the Flame Lab to understand the controlled variables. Its flame is illustrative.
5. Rank the bundled records using transparent condition matching.
6. Open Saffire II sample 2-5 and inspect its observation and limitations.
7. Trace the record to the NASA PSI investigation, DOI, source CSV, and original row.
8. Compare it with another record while keeping material, thickness, and missing conditions visible.

The demonstration should establish traceability and responsible comparison. It should not claim that the prototype identifies the safest material or predicts a real fire.

## Controlled parameter model

The Flame Lab organizes the experimental context into ten parameter groups:

1. Material or fuel.
2. Sample geometry: length, width, and thickness.
3. Gravity condition.
4. Oxygen concentration.
5. Ambient pressure.
6. Forced airflow.
7. Flow direction.
8. Ignition power and duration.
9. Initial temperature.
10. Suppression agent, concentration, and discharge state.

The complete editable reference is in [`parameter_catalog/microgravity_fire_parameter_catalog.md`](parameter_catalog/microgravity_fire_parameter_catalog.md). The generated PDF and its regeneration instructions are in [`parameter_catalog/`](parameter_catalog/).

## How evidence is represented

The code intentionally separates four concepts:

- **Source value:** the original string as reported by the table.
- **Normalized value:** a numeric or canonical value used only when normalization is defensible.
- **Status:** reported, approximate, qualitative, ambiguous, not reported, or not applicable.
- **Provenance:** investigation, source file, source row, DOI, and notes.

This prevents the interface from silently converting incomplete source material into false precision.

Examples preserved by the current data model include:

- Saffire II sample 2-5 contains the thickness string `037 mm`; it is retained as ambiguous and excluded from numeric matching.
- The Saffire II source column is named “Spread Length,” while the sample 2-5 value uses `mm/s`; the interface calls it a source spread-column entry pending verification.
- `Insignificant` is preserved as a qualitative burn-time entry, not displayed as seconds.
- BASS II fan and air display values are not treated as calibrated airflow speeds.
- Pressure remains unknown for the bundled records and is never inferred.

## Current matching logic

The React evidence explorer uses transparent rule-based matching, not an ML score. The implementation is in [`src/science.js`](src/science.js).

The current checks are:

- Material: exact canonical match.
- Oxygen: within ±0.5 percentage points.
- Airflow: within ±2 cm/s.
- Gravity: exact canonical match.
- Pressure: within ±2 kPa when both values exist.
- Geometry: exact sample-width match when requested.
- Outcome: whether the requested source field is available.

Unspecified query fields and unreported record fields do not count as matches. Results expose matched, different, and unknown conditions separately. This score indicates similarity inside the small bundled set; it is not a validated risk score.

## Separate findings and mission-ranking pipeline

The [`findings/`](findings/) directory is a broader research pipeline and is not the same ranking system as the five-row React explorer.

It:

1. Derives structured findings from PSI test tables.
2. Converts reviewed report excerpts into normalized rows.
3. Merges table and report findings.
4. Ranks non-gap findings for ISS, transit, Moon, and Mars scenarios.
5. Builds a standalone findings dashboard.

The mission-ranking formula is documented in [`findings/RANKING_METHOD.md`](findings/RANKING_METHOD.md):

```text
score = 100 × (0.45 × relevance + 0.35 × severity + 0.20 × evidence)
```

Its severity ratings and weights are team-defined analytical choices. Evidence gaps are displayed rather than assigned a score. Report-extracted rows must be checked against the cited page and quotation before presentation as fact.

## Planned ML, AI, and agentic-memory architecture

The proposed intelligence layer should be built only after the evidence model and reviewed corpus are sufficiently mature.

### 1. Dataset preparation

- Expand beyond the five demo rows.
- Preserve raw values alongside transformations.
- Define canonical units, controlled vocabularies, missing-value semantics, and data-quality flags.
- Prevent records from the same experiment or document from leaking across train and evaluation partitions.
- Attach provenance to every feature and target.

### 2. Physics-aware feature engineering

Candidate inputs include material class, geometry, gravity, oxygen concentration and partial pressure, ambient pressure, forced flow, flow direction, ignition energy, initial temperature, and suppression conditions.

Targets must be selected only where the source defines a comparable measurement, such as flame-spread rate, extinction outcome, burn duration, detector response, or gas concentration. Incompatible metrics should not be forced into one target.

### 3. Model development

- Establish simple statistical baselines before complex models.
- Compare candidate models with grouped cross-validation.
- Calibrate predicted uncertainty.
- Evaluate performance by investigation, material family, and atmospheric regime.
- Detect out-of-domain requests instead of returning confident extrapolations.
- Keep similarity, evidence quality, and predicted outcome as separate signals.

### 4. AI reasoning layer

The AI layer should consume structured model outputs, reviewed observations, constraints, and provenance. Its role is to explain the result, identify applicable evidence, expose conflicts, and refuse unsupported conclusions. It must not invent missing measurements or convert a model estimate into an observed fact.

### 5. Agentic memory

Agentic memory is planned as a versioned, auditable store of:

- Experiment identity and source lineage.
- Normalization decisions and unresolved ambiguities.
- Feature definitions and transformations.
- Dataset, model, and validation versions.
- Applicability checks and previous reviewed outcomes.
- Human corrections and approval status.

Memory must not overwrite source records or silently treat user interaction as training data.

### 6. Output contract

Every future analysis should separate:

- **Observed:** directly supported by a cited source.
- **Predicted:** produced by a named model version with uncertainty and applicability limits.
- **Unknown:** absent, ambiguous, incompatible, or outside the validated domain.

## Repository structure

```text
.
├── src/
│   ├── main.jsx              React evidence explorer and guided demo
│   ├── Lab.jsx               Flame Lab UI, controls, playback, and accessibility
│   ├── labScene.js           Three.js room, chamber, flame, airflow, and rendering
│   ├── labModel.js           Qualitative response model and 92-second timeline
│   ├── data.js               Five curated source records and provenance
│   ├── science.js            Deterministic matching and explanation logic
│   ├── science.test.js       Data-handling and ranking tests
│   └── app.css               Active application styles
├── flame_in_freefall_data/   PSI/NTRS catalog, manifests, downloaded tables, reports
├── findings/                 Finding extraction, normalization, ranking, and outputs
├── dashboard/                Generator and standalone findings-dashboard artifacts
├── parameter_catalog/        Editable parameter reference and PDF generator
├── AI_Flow.html              Concept animation for the planned intelligence workflow
├── Solution.html             Cinematic concept demo with explicitly labelled demo content
├── Flame in Freefall.html    Standalone findings-dashboard artifact
├── data_calalogue.md         Short catalog orientation
├── package.json              JavaScript dependencies and commands
└── vite.config.js            Vite build configuration
```

Standalone HTML artifacts are presentation or research outputs. Their presence does not mean their features are integrated into the React application. In particular, `Solution.html` contains cinematic demo scores, telemetry, timings, and AI text; those elements are presentation content rather than implemented analytical results.

## Local development

### Requirements

- Node.js compatible with Vite 7. The current repository was checked with Node.js 24.16.0 and npm 11.13.0.
- Python 3 for data-processing and document-generation utilities.
- Internet access only when following external NASA links or refreshing/downloading source data.

### Install and run

```sh
npm install
npm run dev
```

Vite normally serves the project at `http://localhost:5173/`.

Useful views:

- `/` — evidence explorer and embedded Flame Lab.
- `/#studio` — full-window Flame Lab for manual recording.
- `/#studio-play` — studio view that begins the guided lab sequence after loading.

### Test and build

```sh
npm test
npm run build
npm run preview
```

Current verification:

- `npm test`: **5/5 tests passing**.
- `npm run build`: **currently blocked because the root `index.html` entry is absent from this working tree**. The React source remains present; restore the Vite entry before treating the checkout as build-ready.

The expected Vite entry contains a `#root` element and loads `/src/main.jsx` as a module. This README does not restore deleted working-tree files because those changes may be intentional.

## Flame Lab controls

The Flame Lab is an interactive explanatory model, not a scientific simulation.

- Drag a numeric field horizontally to adjust it.
- Click a numeric field to type a value.
- `Space` — play or pause.
- `F` — toggle full screen.
- `N` — show or hide the parameter panel.
- `T` — show or hide viewport tools.
- `H` — show or hide the status overlay.
- `R` — re-fire the igniter.
- `Home` or `Shift + Left` — return to the start.
- `Left` / `Right` — move one second.
- `0`, `1`, `3`, `7` — switch to hero, flame, side, or top camera.

The 92-second timeline demonstrates how the visualization responds qualitatively to flow, oxygen, pressure, geometry, gravity, direction, temperature, ignition, suppression, and material. The response curves in [`src/labModel.js`](src/labModel.js) are hand-designed explanatory relationships and are not fitted to NASA measurements.

## Data refresh and derived artifacts

### PSI catalog

The scraper uses the public NASA PSI web API. Raw data is approximately 14 TB, so downloads are opt-in and size-limited.

```sh
cd flame_in_freefall_data
python3 psi_scraper.py manifest
python3 psi_scraper.py download --tables
python3 psi_scraper.py download --ids PSI-69 --categories "Raw Data" --ext csv,txt --max-gb 5
```

Review [`flame_in_freefall_data/README.md`](flame_in_freefall_data/README.md) before downloading data.

### Findings and rankings

```sh
python3 findings/build_findings.py
python3 findings/report_rows_to_csv.py
python3 findings/merge_findings.py
python3 findings/rank_findings.py
python3 dashboard/build_dashboard.py
```

The optional PDF extraction utility requires additional dependencies and an external model API. Its output must be reviewed before use.

### Parameter PDF

```sh
python3 parameter_catalog/generate_parameter_pdf.py
```

Edit the Markdown catalog first; the PDF is generated output.

## Testing scope

The existing tests verify that:

- The closest SIBAL row ranks first for the default scenario without being falsely labelled an exact match.
- Unspecified inputs do not count as matches.
- Qualitative and unavailable source values do not receive fabricated numeric units.
- Ambiguous thickness and the spread-column conflict remain disclosed.
- Bundled rows retain their expected source-row provenance.

The repository does not yet contain automated browser, visual-regression, Three.js performance, accessibility, data-pipeline, or ML-evaluation tests.

## Limitations and responsible-use boundaries

- The active demo covers only five curated experiment rows.
- The wider catalog has heterogeneous schemas and cannot be treated as a single clean training table.
- The current matching logic is heuristic and unvalidated as a safety-risk score.
- The mission-ranking pipeline includes team-defined severity judgments and weights.
- Report-derived findings require human verification against the cited source pages.
- The visual flame, airflow, soot, ignition, and suppression effects are qualitative.
- No measured video is bundled.
- No backend, authentication, database, telemetry, live AI service, or persistent memory service is implemented.
- External PSI and DOI links require internet access.
- There is currently no repository license file; do not assume redistribution rights.

## Source domains

- [NASA Physical Sciences Informatics](https://psi.nasa.gov/)
- [NASA Technical Reports Server](https://ntrs.nasa.gov/)

NASA names, investigation identifiers, and links are used for source attribution. Team Flamme and Fire Navigator remain separate from NASA's identity.
