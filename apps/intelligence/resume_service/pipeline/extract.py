"""PDF text extraction using PyMuPDF (fitz).

Inspired by utkarshx27/Resum-Parsing-Using-NLP. We:
  1. Open the PDF from in-memory bytes.
  2. Extract text per page using the 'text' layout (preserves reading order
     better than raw 'rawdict' for resumes).
  3. Concatenate with double newlines so spaCy sentence detection works.
"""
from __future__ import annotations

import io

import fitz  # PyMuPDF

from shared.observability import get_logger

log = get_logger(__name__)


def extract_text(file_bytes: bytes) -> str:
    """Extract concatenated text from a PDF file's bytes.

    Falls back to OCR-friendly empty string if the PDF has no text layer
    (caller should treat short text as an error and surface 'failed').
    """
    if not file_bytes:
        return ""

    pages: list[str] = []
    try:
        with fitz.open(stream=io.BytesIO(file_bytes), filetype="pdf") as doc:
            for page in doc:
                # 'text' = simple, reading-order-preserving plain text.
                pages.append(page.get_text("text"))
    except Exception as exc:
        log.error("pdf.extract_failed", error=str(exc))
        raise

    text = "\n\n".join(p.strip() for p in pages if p.strip())
    log.info("pdf.extract_ok", pages=len(pages), chars=len(text))
    return text
