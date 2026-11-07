#!/usr/bin/env python3
"""Create a provenance-preserving, long-format view of NASA PSI table exports.

The source tables use different schemas. This cleaner therefore does not force
all experiments into one guessed wide schema. It keeps the original cell,
normalizes only unambiguous scalar values, and labels every transformation.
"""

from __future__ import annotations

import csv
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TABLE_ROOT = ROOT / "psi_data"
OUT_ROOT = ROOT / "cleaned"

NUMERIC_RE = re.compile(
    r"^(?P<prefix>[~≈≤≥<>]?\s*)(?P<number>[-+]?\d+(?:\.\d+)?)\s*(?P<unit>[A-Za-zµμ%°/²³._ -]*)\s*$"
)
NUMBER_RE = re.compile(r"[-+]?\d+(?:\.\d+)?")

UNIT_ALIASES = {
    "cm": "cm", "mm": "mm", "m": "m", "um": "um", "µm": "um", "μm": "um",
    "micron": "um", "microns": "um", "cm/s": "cm/s", "cms": "cm/s", "cm s": "cm/s",
    "mm/s": "mm/s", "s": "s", "sec": "s", "secs": "s", "second": "s", "seconds": "s",
    "min": "min", "mins": "min", "minute": "min", "minutes": "min", "w": "W",
    "kw": "kW", "kpa": "kPa", "atm": "atm", "bar": "bar", "%": "%", "percent": "%",
    "ppm": "ppm", "k": "K", "c": "C", "°c": "C", "mg/s": "mg/s", "mg/min": "mg/min",
    "sccm": "sccm", "ml/min": "mL/min", "g/s": "g/s", "g": "g",
}

QUALITATIVE = {
    "none", "n/a", "na", "not applicable", "not stated", "not reported", "unknown",
    "insignificant", "complete", "acceleratory", "over", "or", "video", "see notes",
}


def slug(value: str) -> str:
    value = unicodedata.normalize("NFKC", value.replace("\ufeff", "")).strip().lower()
    value = value.replace("µ", "u").replace("μ", "u")
    value = re.sub(r"[^a-z0-9]+", "_", value).strip("_")
    return value or "unnamed_column"


def dedupe_headers(headers: list[str]) -> list[tuple[str, str]]:
    counts: Counter[str] = Counter()
    result: list[tuple[str, str]] = []
    for header in headers:
        label = unicodedata.normalize("NFKC", header.replace("\ufeff", "")).strip()
        key = slug(label)
        counts[key] += 1
        if counts[key] > 1:
            key = f"{key}_{counts[key]}"
        result.append((label, key))
    return result


def looks_like_note(row: list[str]) -> bool:
    values = [str(cell).strip() for cell in row if str(cell).strip()]
    if not values:
        return False
    first = values[0].lower()
    if first.startswith(("note", "source:", "reference:")):
        return True
    if re.fullmatch(r"f\d+c\d+(?:/f\d+c\d+)?", first) and any("pre-test" in v.lower() for v in values[1:]):
        return True
    return False


def canonical_unit(unit: str) -> str:
    compact = re.sub(r"\s+", " ", unit.strip().lower())
    compact = compact.replace(" per ", "/").replace("‐", "-").replace("–", "-")
    return UNIT_ALIASES.get(compact, compact)


def clean_cell(raw: str) -> tuple[str, str, str, str]:
    value = unicodedata.normalize("NFKC", raw.replace("\ufeff", "")).strip()
    if not value:
        return "", "", "missing", ""
    lowered = re.sub(r"\s+", " ", value.lower()).strip()
    if lowered in QUALITATIVE:
        return lowered, lowered, "qualitative", "qualitative"
    match = NUMERIC_RE.match(value)
    if match:
        unit = canonical_unit(match.group("unit"))
        number = match.group("number")
        prefix = match.group("prefix").strip()
        # NASA's Saffire table contains the literal string "037 mm". It is
        # ambiguous whether that means 0.37 mm or a formatting artifact, so
        # retain the source text without turning it into a model feature.
        if unit and number.startswith("0") and len(number) > 1 and "." not in number:
            return value, "", "ambiguous", "leading-zero scalar"
        status = "reported" if not prefix else "approximate" if prefix in {"~", "≈"} else "bounded"
        return value, number, "numeric", f"{status}:{unit}" if unit else status
    if len(NUMBER_RE.findall(value)) > 1:
        return value, "", "ambiguous", "multiple numeric values"
    return value, "", "qualitative", "text"


def load_source_map() -> dict[tuple[str, str], dict[str, str]]:
    result: dict[tuple[str, str], dict[str, str]] = {}
    manifest = ROOT / "experimental_tables.csv"
    with manifest.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            result[(row["psi_id"], row["filename"])] = row
    return result


def read_rows(path: Path) -> tuple[str, list[list[str]]]:
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            with path.open(encoding=encoding, newline="") as handle:
                return encoding, list(csv.reader(handle))
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("unknown", b"", 0, 1, f"could not decode {path}")


def run() -> int:
    OUT_ROOT.mkdir(exist_ok=True)
    source_map = load_source_map()
    value_fields = [
        "record_id", "psi_id", "acronym", "psi_url", "download_url", "source_file", "source_row", "row_kind",
        "column_index", "source_column", "column_key", "raw_value", "normalized_value",
        "value_type", "status", "unit",
    ]
    report_fields = [
        "psi_id", "acronym", "source_file", "encoding", "source_rows", "data_rows",
        "note_rows", "nonempty_cells", "numeric_cells", "qualitative_cells", "ambiguous_cells",
    ]
    reports: list[dict[str, object]] = []
    values_path = OUT_ROOT / "cleaned_values.csv"
    with values_path.open("w", encoding="utf-8", newline="") as values_handle:
        values_writer = csv.DictWriter(values_handle, fieldnames=value_fields)
        values_writer.writeheader()
        for path in sorted(TABLE_ROOT.glob("*/Experimental table/*.csv")):
            psi_id = path.parts[-3]
            source_file = path.name
            metadata = source_map.get((psi_id, source_file), {})
            encoding, rows = read_rows(path)
            if not rows:
                continue
            headers = dedupe_headers(rows[0])
            counters: Counter[str] = Counter()
            note_rows = 0
            data_rows = 0
            for source_row, row in enumerate(rows[1:], start=2):
                if not any(str(cell).strip() for cell in row):
                    continue
                row_kind = "note" if looks_like_note(row) else "data"
                if row_kind == "note":
                    note_rows += 1
                else:
                    data_rows += 1
                record_id = f"{psi_id}:{source_row}"
                for column_index, (header, key) in enumerate(headers, start=1):
                    raw = row[column_index - 1] if column_index - 1 < len(row) else ""
                    if not str(raw).strip():
                        continue
                    raw_value, normalized, value_type, status = clean_cell(str(raw))
                    counters["nonempty_cells"] += 1
                    counters[f"{value_type}_cells"] += 1
                    unit = status.split(":", 1)[1] if status.startswith(("reported:", "approximate:", "bounded:")) else ""
                    values_writer.writerow({
                        "record_id": record_id,
                        "psi_id": psi_id,
                        "acronym": metadata.get("acronym", ""),
                        "psi_url": f"https://psi.nasa.gov/physci/repo/data/investigations/{psi_id}",
                        "download_url": metadata.get("download_url", ""),
                        "source_file": source_file,
                        "source_row": source_row,
                        "row_kind": row_kind,
                        "column_index": column_index,
                        "source_column": header,
                        "column_key": key,
                        "raw_value": raw_value,
                        "normalized_value": normalized,
                        "value_type": value_type,
                        "status": status.split(":", 1)[0] if ":" in status else status,
                        "unit": unit,
                    })
            reports.append({
                "psi_id": psi_id,
                "acronym": metadata.get("acronym", ""),
                "source_file": source_file,
                "encoding": encoding,
                "source_rows": max(0, len(rows) - 1),
                "data_rows": data_rows,
                "note_rows": note_rows,
                **{key: counters[key] for key in ("nonempty_cells", "numeric_cells", "qualitative_cells", "ambiguous_cells")},
            })
    with (OUT_ROOT / "cleaning_report.csv").open("w", encoding="utf-8", newline="") as report_handle:
        writer = csv.DictWriter(report_handle, fieldnames=report_fields)
        writer.writeheader()
        writer.writerows(reports)
    print(f"cleaned {len(reports)} source tables into {values_path}")
    print(f"emitted {sum(int(row['nonempty_cells']) for row in reports)} non-empty source cells")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(run())
    except (OSError, csv.Error, ValueError) as exc:
        print(f"cleaning failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
