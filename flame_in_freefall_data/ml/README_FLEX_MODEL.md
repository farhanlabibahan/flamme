# ML: grounding the 3D lab (plan item 4)

`build_flex_model.py` is the documented pipeline that grounds the Lab in real NASA data.

```bash
python3 build_flex_model.py
```

## What it does
1. **Pivots** the 274 individual FLEX (PSI-69) droplet-flame tests out of the long/tidy
   `../cleaned/cleaned_values.csv` into one row per test.
2. **Cleans**: converts pressure (mmHg → atm), derives `self_extinguished` from the source's
   extinction-diameter column (numeric = extinguished early, explicit "–" = burned to
   completion, missing = unknown and excluded from training, never guessed) → `flex_tests_clean.csv`,
   `flex_feature_dictionary.md`.
3. **Feature engineers**: O₂%, pressure (atm), `o2_partial_pressure_atm` (O₂% × pressure — the
   physically meaningful combined term), droplet diameter, fuel (Methanol/Heptane) encoding.
4. **Fits two real models**, standardized features, held-out test split:
   - Logistic regression → self-extinguish probability (test AUC 0.91, n=223)
   - Linear regression → burning-rate constant K (test R² 0.45, n=258)
5. **Exports** `../../src/flexModel.json` — scaler + coefficients + the 274 real tests
   themselves (for nearest-neighbor lookup), consumed client-side by `src/flexModel.js`
   (`predictFlex`, `nearestFlexTest`). No backend, no training in the browser — just the
   already-fitted numbers.

## Where it shows up
`/lab` → "Grounded in NASA FLEX data" card: predicted self-extinguish probability + burning
rate for the current O₂/pressure slider values, plus the single closest real FLEX test and
its actual measured outcome.

## Scope, stated honestly in the UI and here
FLEX is free-floating liquid-droplet combustion (methanol/heptane) — a different physical
regime from the lab's solid-sample sheet (SIBAL/PMMA/silicone, `labModel.js`). This is why
it is wired in as a clearly-labeled side-by-side comparison, not blended into the
illustrative solid-sample curves: that would misrepresent the physics. Grounding the
solid-sample model itself needs BASS/BASS-II/Saffire row-level data (same cleaning approach,
different source table) — a natural next step, not done here.
