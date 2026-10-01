#!/usr/bin/env python3
"""Generate a polished PDF from the editable parameter catalog Markdown.

Usage:
    python3 generate_parameter_pdf.py
    python3 generate_parameter_pdf.py source.md output.pdf
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


BASE = Path(__file__).resolve().parent
DEFAULT_SOURCE = BASE / "microgravity_fire_parameter_catalog.md"
DEFAULT_OUTPUT = BASE / "microgravity_fire_parameter_catalog.pdf"


def register_fonts() -> tuple[str, str, str, str]:
    candidates = [
        (
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Italic.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf",
        ),
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf",
        ),
    ]
    for regular, bold, italic, bold_italic in candidates:
        if all(Path(p).exists() for p in (regular, bold, italic, bold_italic)):
            pdfmetrics.registerFont(TTFont("CatalogSans", regular))
            pdfmetrics.registerFont(TTFont("CatalogSans-Bold", bold))
            pdfmetrics.registerFont(TTFont("CatalogSans-Italic", italic))
            pdfmetrics.registerFont(TTFont("CatalogSans-BoldItalic", bold_italic))
            pdfmetrics.registerFontFamily(
                "CatalogSans",
                normal="CatalogSans",
                bold="CatalogSans-Bold",
                italic="CatalogSans-Italic",
                boldItalic="CatalogSans-BoldItalic",
            )
            return (
                "CatalogSans",
                "CatalogSans-Bold",
                "CatalogSans-Italic",
                "CatalogSans-BoldItalic",
            )
    return ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique")


FONT, FONT_BOLD, FONT_ITALIC, FONT_BOLD_ITALIC = register_fonts()


class NumberedCanvasMixin:
    pass


class CatalogDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="catalog", frames=[frame], onPage=self._decorate_page))

    def _decorate_page(self, canvas, doc):
        canvas.saveState()
        width, height = A4
        canvas.setFillColor(colors.HexColor("#0B1F33"))
        canvas.rect(0, height - 15 * mm, width, 15 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#EAFE07"))
        canvas.setFont(FONT_BOLD, 8.5)
        canvas.drawString(18 * mm, height - 10 * mm, "FLAME IN FREEFALL")
        canvas.setFillColor(colors.HexColor("#D8E6F3"))
        canvas.setFont(FONT, 7.5)
        canvas.drawRightString(width - 18 * mm, height - 10 * mm, "Microgravity Fire Safety Parameter Catalog")
        canvas.setStrokeColor(colors.HexColor("#C6D3DF"))
        canvas.setLineWidth(0.4)
        canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
        canvas.setFillColor(colors.HexColor("#53677A"))
        canvas.setFont(FONT, 7.5)
        canvas.drawString(18 * mm, 9.5 * mm, "Editable source: microgravity_fire_parameter_catalog.md")
        canvas.drawRightString(width - 18 * mm, 9.5 * mm, f"Page {doc.page}")
        canvas.restoreState()


def styles():
    base = getSampleStyleSheet()
    body = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName=FONT,
        fontSize=8.6,
        leading=12.2,
        textColor=colors.HexColor("#16283A"),
        spaceAfter=4.5,
        allowWidows=0,
        allowOrphans=0,
    )
    return {
        "title": ParagraphStyle(
            "Title",
            parent=body,
            fontName=FONT_BOLD,
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#0B1F33"),
            alignment=TA_LEFT,
            spaceAfter=10,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=body,
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#38536B"),
            spaceAfter=8,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=body,
            fontName=FONT_BOLD,
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0B3C5D"),
            spaceBefore=12,
            spaceAfter=7,
            keepWithNext=True,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=body,
            fontName=FONT_BOLD,
            fontSize=12.3,
            leading=15.5,
            textColor=colors.HexColor("#11698E"),
            spaceBefore=9,
            spaceAfter=5,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=body,
            fontName=FONT_BOLD,
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#244E64"),
            spaceBefore=7,
            spaceAfter=4,
            keepWithNext=True,
        ),
        "body": body,
        "bullet": ParagraphStyle(
            "Bullet",
            parent=body,
            leftIndent=11,
            firstLineIndent=-6,
            bulletIndent=3,
            spaceAfter=2.5,
        ),
        "code": ParagraphStyle(
            "Code",
            parent=body,
            fontName="Courier",
            fontSize=7.2,
            leading=9.5,
            textColor=colors.HexColor("#EAF2F8"),
            backColor=colors.HexColor("#102A43"),
            leftIndent=7,
            rightIndent=7,
            borderPadding=7,
            spaceBefore=4,
            spaceAfter=7,
        ),
        "meta": ParagraphStyle(
            "Meta",
            parent=body,
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#38536B"),
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            parent=body,
            fontName=FONT_BOLD,
            fontSize=7.2,
            leading=8.7,
            textColor=colors.white,
            alignment=TA_LEFT,
        ),
        "table_cell": ParagraphStyle(
            "TableCell",
            parent=body,
            fontSize=7,
            leading=8.6,
            textColor=colors.HexColor("#16283A"),
        ),
    }


STYLES = styles()


def inline_markup(text: str) -> str:
    text = html.escape(text.strip())
    text = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", text)
    text = re.sub(
        r"(https?://[^\s&lt;]+)",
        lambda m: f'<link href="{html.unescape(m.group(1))}" color="#0A6E9C">{m.group(1)}</link>',
        text,
    )
    return text


def parse_table(lines: list[str]) -> list[list[str]]:
    rows = []
    for line in lines:
        parts = [part.strip() for part in line.strip().strip("|").split("|")]
        rows.append(parts)
    if len(rows) > 1 and all(re.fullmatch(r":?-{3,}:?", x.replace(" ", "")) for x in rows[1]):
        rows.pop(1)
    return rows


def make_table(rows: list[list[str]], available_width: float):
    cols = max(len(row) for row in rows)
    rows = [row + [""] * (cols - len(row)) for row in rows]
    if cols == 2:
        widths = [available_width * 0.32, available_width * 0.68]
    elif cols == 3:
        widths = [available_width * 0.25, available_width * 0.22, available_width * 0.53]
    elif cols == 4:
        widths = [available_width * 0.21, available_width * 0.16, available_width * 0.24, available_width * 0.39]
    else:
        widths = [available_width / cols] * cols
    data = []
    for r_idx, row in enumerate(rows):
        style = STYLES["table_header"] if r_idx == 0 else STYLES["table_cell"]
        data.append([Paragraph(inline_markup(cell), style) for cell in row])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B3C5D")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B6C7D6")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F1F6FA")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def markdown_to_story(text: str, width: float):
    lines = text.splitlines()
    story = []
    paragraph_lines: list[str] = []
    in_code = False
    code_lines: list[str] = []
    first_heading = True

    def flush_paragraph():
        nonlocal paragraph_lines
        if paragraph_lines:
            joined = " ".join(x.strip() for x in paragraph_lines)
            story.append(Paragraph(inline_markup(joined), STYLES["body"]))
            paragraph_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped.startswith("```"):
            flush_paragraph()
            if in_code:
                safe = "<br/>".join(html.escape(x).replace(" ", "&nbsp;") for x in code_lines)
                story.append(Paragraph(safe or "&nbsp;", STYLES["code"]))
                code_lines = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue
        if in_code:
            code_lines.append(line)
            i += 1
            continue
        if stripped.startswith("|") and "|" in stripped[1:]:
            flush_paragraph()
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            story.append(make_table(parse_table(table_lines), width))
            story.append(Spacer(1, 6))
            continue
        if stripped == "---":
            flush_paragraph()
            story.append(Spacer(1, 5))
            i += 1
            continue
        if stripped.startswith("# "):
            flush_paragraph()
            if not first_heading:
                story.append(PageBreak())
            story.append(Spacer(1, 22 * mm if first_heading else 0))
            story.append(Paragraph(inline_markup(stripped[2:]), STYLES["title"] if first_heading else STYLES["h1"]))
            first_heading = False
            i += 1
            continue
        if stripped.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[3:]), STYLES["h1"]))
            i += 1
            continue
        if stripped.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[4:]), STYLES["h2"]))
            i += 1
            continue
        if re.match(r"^\d+\.\s+", stripped):
            flush_paragraph()
            number, content = stripped.split(".", 1)
            story.append(Paragraph(inline_markup(content.strip()), STYLES["bullet"], bulletText=f"{number}."))
            i += 1
            continue
        if stripped.startswith("- "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[2:]), STYLES["bullet"], bulletText="•"))
            i += 1
            continue
        if stripped.startswith("**") and ":**" in stripped:
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped), STYLES["meta"]))
            i += 1
            continue
        if not stripped:
            flush_paragraph()
            i += 1
            continue
        paragraph_lines.append(stripped)
        i += 1
    flush_paragraph()
    return story


def build(source: Path, output: Path):
    if not source.exists():
        raise FileNotFoundError(f"Source Markdown not found: {source}")
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = CatalogDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=19 * mm,
        title="Microgravity Fire Safety Parameter Catalog",
        author="Flame in Freefall project",
        subject="Canonical parameter ontology and dataset discovery guide",
    )
    story = markdown_to_story(source.read_text(encoding="utf-8"), doc.width)
    doc.build(story)
    print(f"Generated: {output}")


if __name__ == "__main__":
    source_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_SOURCE
    output_path = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else DEFAULT_OUTPUT
    build(source_path, output_path)

