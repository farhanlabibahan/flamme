#!/usr/bin/env python3
import csv
import unittest
from pathlib import Path

from clean_tables import OUT_ROOT, run


class CleanTableTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run()

    def test_all_source_tables_are_reported(self):
        with (OUT_ROOT / "cleaning_report.csv").open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.assertEqual(len(rows), 22)
        self.assertEqual({row["encoding"] for row in rows}, {"utf-8-sig", "cp1252"})

    def test_raw_values_and_provenance_are_preserved(self):
        with (OUT_ROOT / "cleaned_values.csv").open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.assertGreater(len(rows), 24000)
        self.assertTrue(all(row["raw_value"] and row["source_file"] and row["source_row"] and row["psi_url"] and row["download_url"] for row in rows))
        self.assertTrue(any(row["raw_value"] == "0.9   1.3   2.75" and row["value_type"] == "ambiguous" for row in rows))

    def test_known_ambiguous_saffire_value_is_not_numeric(self):
        with (OUT_ROOT / "cleaned_values.csv").open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        matches = [row for row in rows if row["psi_id"] == "PSI-99" and row["raw_value"] == "037 mm"]
        self.assertEqual(len(matches), 3)
        self.assertTrue(all(row["value_type"] == "ambiguous" and not row["normalized_value"] for row in matches))


if __name__ == "__main__":
    unittest.main()
