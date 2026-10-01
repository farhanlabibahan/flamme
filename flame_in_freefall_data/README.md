# Flame in Freefall — NASA microgravity combustion data catalog

Harvested 2026-10-01 from the NASA Physical Sciences Informatics (PSI) repository API and the NASA Technical Reports Server (NTRS).

## What's here

| File | Contents |
|---|---|
| `flame_in_freefall_data_catalog.xlsx` | Everything below in one workbook, with clickable links |
| `investigations.csv` | 24 PSI combustion investigations (19 ISS/Cygnus flight experiments + 5 ground studies built on them): objectives, dates, DOI, PSI page, raw-data size |
| `experimental_tables.csv` | Direct links to the 22 test-matrix CSVs (~3,000 test rows total). **Most dashboard-ready data — start here.** |
| `psi_files_manifest.csv` | 765 non-raw files (analyzed data, reports, science/engineering docs, presentations, images) with direct download links |
| `ntrs_reports.csv` | 40 key NTRS reports/papers (results, summaries, workshop proceedings) with PDF links |
| `catalog.json` | Same data as JSON for your app |
| `psi_scraper.py` | Re-scrapes the full manifest (all ~73,700 files) and downloads selectively |

## The investigations

| Theme | PSI IDs |
|---|---|
| Droplet flames / suppression / cool flames | FLEX PSI-69, FLEX-2 PSI-68, CFI PSI-39 (+ ground PSI-117, PSI-142) |
| Solid-material flammability & suppression | BASS PSI-26, BASS-II PSI-25 (+ ground PSI-62) |
| Large-scale spacecraft fires | SAFFIRE-I PSI-98, SAFFIRE-II PSI-99, SAFFIRE-III PSI-100 |
| Smoke & fire detection | SAME PSI-102, SAME-R PSI-101, DAFT PSI-47 (+ ground PSI-115) |
| Gaseous flames, soot, extinction (CIR/ACME) | ACME BRE PSI-20, CLD PSI-21, E-FIELD PSI-22, s-Flame PSI-23, Flame Design PSI-10, CFI-G PSI-159, SPICE PSI-107, SLICE PSI-106 (+ ground PSI-60) |

Investigation pages: `https://psi.nasa.gov/physci/repo/data/investigations/<PSI-ID>`

## Downloading

Every link has the form
`https://psi.nasa.gov/geode-py/ws/studies/<PSI-ID>/download?file=<filename>&version=<v>`
and redirects straight to the file (public, no login).

```bash
pip install requests
python psi_scraper.py download --tables        # 22 test-matrix CSVs, ~200 KB  (do this first)
python psi_scraper.py download --analysis      # tables + analyzed data + reports + science docs, ~2 GB
python psi_scraper.py manifest                 # full list of all ~73,700 files incl. raw -> psi_manifest.csv
python psi_scraper.py download --ids PSI-69 --categories "Raw Data" --ext csv,txt --max-gb 5
```

Raw data totals ~13.9 TB (flame videos, image sequences, sensor logs), so raw downloads are opt-in and filterable.
FLEX and FLEX-2 also have 183 calibration files, which the scraper includes.
