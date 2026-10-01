# Editable parameter catalog and PDF generator

This folder contains the editable source and the command used to create the PDF.

## Files

- `microgravity_fire_parameter_catalog.md` - editable source of truth
- `generate_parameter_pdf.py` - PDF generator
- `microgravity_fire_parameter_catalog.pdf` - generated publication

## Regenerate the PDF

From this directory, run:

```bash
/Users/shahriarislam/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 generate_parameter_pdf.py
```

If your regular Python environment already has ReportLab installed, this also works:

```bash
python3 generate_parameter_pdf.py
```

Install the only required package when needed:

```bash
python3 -m pip install reportlab
```

You can also specify different source and output paths:

```bash
python3 generate_parameter_pdf.py edited_catalog.md edited_catalog.pdf
```

## Editing workflow

1. Edit `microgravity_fire_parameter_catalog.md` in any text editor.
2. Keep Markdown tables well formed, with one header row and separator row.
3. Run the generation command.
4. Open the resulting PDF and review tables and page breaks.

The generator supports headings, paragraphs, numbered and bulleted lists, fenced code blocks, and Markdown tables.

