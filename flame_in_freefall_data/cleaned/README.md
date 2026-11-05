# Cleaned PSI table view

`cleaned_values.csv` is a provenance-preserving long-format view of every local NASA PSI experimental-table export.

Each non-empty source cell remains available in `raw_value`. `normalized_value` is populated only for one unambiguous scalar number; ranges, sequences, note-bearing values, and mixed strings remain blank and are labelled `ambiguous` or `qualitative`. Missing cells are not emitted, so absence is not confused with zero. Each row includes the PSI investigation URL and the direct source-file download URL.

`cleaning_report.csv` records the source encoding and row/cell counts for each table. The cleaner accepts UTF-8 BOM, CP1252, and Latin-1 inputs and strips embedded note rows from the data count while preserving them in the long output with `row_kind=note`.

Regenerate from the repository root:

```bash
python3 flame_in_freefall_data/clean_tables.py
```
