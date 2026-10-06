# Fire Navigator

Source-linked concept prototype for the 2026 NASA Space Apps Challenge, **Flame in Freefall**. It is not NASA-endorsed and does not certify material or spacecraft fire safety.

## Run

```sh
npm install
npm run dev
npm test
npm run build
```

The Vite app runs locally. Five curated experiment excerpts are bundled, so the demo works without internet after dependencies are installed. NASA investigation and DOI links require internet.

## What the prototype actually does

- Ranks five source-table excerpts by transparent condition matching.
- Preserves source strings and separates normalized numbers from unreported, ambiguous, and qualitative entries.
- Presents an observed result, a rule-based interpretation, and limitations with a trace to the source CSV row and NASA PSI investigation.
- Walks through a five-step guided demo from question to comparison.
- Provides a rotatable 3D chamber and animated **illustrative** flame; this is neither measured footage nor a validated combustion simulation.

The app **does not yet run an AI model**. Its present interpretation is a deterministic template. A future grounded retrieval-and-generation component should be evaluated for source fidelity, refusal on insufficient evidence, and citation accuracy before being called an AI analysis system. No measured footage is bundled.

## Source excerpts

Saffire II PSI-99: samples 2-1, 2-2, 2-3, and 2-5. BASS II PSI-25: test B1. CSV snapshots are in `flame_in_freefall_data/psi_data`.

The Saffire II source contains `037 mm` for sample 2-5 thickness, preserved as ambiguous and not normalized. Its microgravity spread column is named “Spread Length” although the sample 2-5 entry has speed units (`2.1 mm/s`); the UI names it a source-column entry pending verification. “Insignificant” in the silicone burn-time field is qualitative, not seconds. BASS II fan/air display readings are not converted to calibrated airflow speed. Pressure is missing from the bundled rows.

## Presentation path

Click **Start guided demo**. The five steps move through the question, scenario, 3D setup, ranked evidence with source trace, and a qualified comparison. Reset restores the starting state. The **Measured media** tab explicitly shows that no video is bundled, rather than presenting the animation as NASA footage.

See [AUDIT.md](AUDIT.md) for the completed audit, fixes, and remaining limitations.

## Flame Lab (3D chamber)

The `/` page opens with a full-width 3D room — a Saffire-style flow duct inside a spacecraft lab module — next to a minimal panel holding the ten controlled parameters from the parameter catalogue: material, sample geometry, gravity, oxygen, pressure, forced airflow, flow direction, ignition, initial temperature and suppression. Drag a field to change it, or click it to type a value.

**Recording the video:** open `http://localhost:5173/#studio` (room fills the window), press **F** for full screen, start your screen recorder, then click **Simulate**. A 92-second sequence steps through all ten parameters with camera moves and subtitles; the field being changed is highlighted in green. **Space** pauses, **N** hides the parameter panel, **H** hides the status label, **R** re-fires the igniter.

The flame, airflow, soot and suppression spray respond with qualitative, illustrative curves (`src/labModel.js`). They show the expected *direction* of change only — they are not fitted to NASA data and are labelled as illustrative on screen.
