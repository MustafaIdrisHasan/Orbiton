"""Orbiton resume parsing service.

Pipeline: PDF/Docx -> raw text (PyMuPDF) -> spaCy 3 transformer NER ->
JSON Resume schema -> HMAC-signed webhook back to Node.
"""

PIPELINE_VERSION = "1.0.0"
