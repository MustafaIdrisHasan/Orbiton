"""Smoke tests for normalize.py — runs without spaCy installed."""
from __future__ import annotations

from resume_service.pipeline.ner import NerDoc
from resume_service.pipeline.normalize import to_json_resume


SAMPLE_RESUME = """\
Jane Doe
jane.doe@example.com | +91 98765 43210 | https://github.com/janedoe

EDUCATION
Indian Institute of Technology, Bombay
B.Tech in Computer Science
2020 - 2024  CGPA: 8.7

EXPERIENCE
Software Engineering Intern at Acme Corp
Jun 2023 - Aug 2023
- Built a REST API with FastAPI and PostgreSQL
- Improved cold-start latency by 40%

PROJECTS
Orbiton Resume Parser
- spaCy 3 + PyMuPDF + JSON Resume normalizer

SKILLS
Python, FastAPI, PostgreSQL, Docker, Kubernetes
"""


def test_to_json_resume_extracts_basics():
    ner = NerDoc(
        text=SAMPLE_RESUME,
        skills=["python", "fastapi", "postgresql", "docker", "kubernetes"],
        emails=["jane.doe@example.com"],
        phones=["+91 98765 43210"],
        urls=["https://github.com/janedoe"],
        cgpa=8.7,
        model_version="en_core_web_trf-3.7.0",
    )
    resume = to_json_resume(text=SAMPLE_RESUME, ner_doc=ner)

    assert resume.basics.email == "jane.doe@example.com"
    assert "fastapi" in {s.name for s in resume.skills}
    assert resume.education and resume.education[0].score == "8.7"
    assert resume.work and "Acme Corp" in (resume.work[0].name or "")
    assert resume.projects
    assert resume.meta["extracted_cgpa"] == 8.7


def test_empty_text_yields_empty_resume():
    ner = NerDoc(text="", model_version="test")
    resume = to_json_resume(text="", ner_doc=ner)
    assert resume.skills == []
    assert resume.education == []
    assert resume.work == []
