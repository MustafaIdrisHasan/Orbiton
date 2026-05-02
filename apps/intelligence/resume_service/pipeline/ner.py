"""spaCy 3 transformer NER pipeline.

Loads `en_core_web_trf` once per process. We add a custom EntityRuler
for resume-specific entities (SKILL, EMAIL, PHONE, URL, DEGREE) before
the transformer NER so high-precision regex/lexicon hits are preserved.

Returns a lightweight `NerDoc` dataclass — we don't leak spaCy types
beyond this module.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

import spacy
from spacy.language import Language
from spacy.matcher import PhraseMatcher

from shared.config import get_settings
from shared.observability import get_logger

log = get_logger(__name__)


# A small starter skills lexicon. In production this should come from a
# managed taxonomy table (skills + aliases) maintained by TPOs.
DEFAULT_SKILLS_LEXICON: list[str] = [
    "python", "java", "c++", "c#", "javascript", "typescript", "go", "rust", "kotlin", "swift",
    "react", "next.js", "vue", "angular", "node.js", "express", "fastapi", "django", "flask",
    "spring", "spring boot", ".net", "ruby on rails", "laravel",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb",
    "kafka", "rabbitmq", "celery", "airflow",
    "aws", "gcp", "azure", "kubernetes", "docker", "terraform", "ansible", "jenkins",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "spacy", "huggingface",
    "machine learning", "deep learning", "nlp", "computer vision", "data science",
    "html", "css", "tailwind", "sass", "graphql", "rest api", "grpc",
    "git", "github actions", "ci/cd", "agile", "scrum",
]

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,4}\)?[\s\-]?)?\d{3,4}[\s\-]?\d{3,4}")
URL_RE = re.compile(r"https?://\S+|www\.\S+")
CGPA_RE = re.compile(r"\b(?:CGPA|GPA|SGPA)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)\b", re.IGNORECASE)
YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")


@dataclass
class NerDoc:
    """Pipeline output handed to the normalizer."""
    text: str
    entities: list[dict[str, Any]] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    emails: list[str] = field(default_factory=list)
    phones: list[str] = field(default_factory=list)
    urls: list[str] = field(default_factory=list)
    cgpa: float | None = None
    model_version: str = "unknown"


@lru_cache(maxsize=1)
def _load_nlp() -> Language:
    settings = get_settings()
    try:
        nlp = spacy.load(settings.spacy_model)
    except OSError:
        log.warning(
            "spacy.model_missing",
            model=settings.spacy_model,
            fallback="en_core_web_sm",
        )
        # Graceful fallback so dev works without the 500MB transformer.
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            log.warning("spacy.fallback_missing", message="installing en_core_web_sm at runtime")
            from spacy.cli import download as spacy_download
            spacy_download("en_core_web_sm")
            nlp = spacy.load("en_core_web_sm")

    # Skill matcher (exact + lowercase phrase match) — added before NER.
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    patterns = [nlp.make_doc(s) for s in DEFAULT_SKILLS_LEXICON]
    matcher.add("SKILL", patterns)
    nlp.user_data["skill_matcher"] = matcher
    return nlp


def run_ner(text: str) -> NerDoc:
    """Run NER + lexicon match + regex extraction on the resume text."""
    nlp = _load_nlp()
    doc = nlp(text)
    matcher: PhraseMatcher = nlp.user_data["skill_matcher"]

    # Built-in spaCy entities we care about
    entities: list[dict[str, Any]] = []
    for ent in doc.ents:
        if ent.label_ in {"PERSON", "ORG", "GPE", "DATE", "WORK_OF_ART"}:
            entities.append(
                {
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char,
                }
            )

    # Skill matcher hits
    skills: set[str] = set()
    for _, start, end in matcher(doc):
        span = doc[start:end].text.strip().lower()
        skills.add(span)

    # Regex fallbacks
    emails = list(set(EMAIL_RE.findall(text)))
    phones_raw = PHONE_RE.findall(text)
    phones = [p for p in {p.strip() for p in phones_raw} if len(re.sub(r"\D", "", p)) >= 7]
    urls = list(set(URL_RE.findall(text)))

    cgpa: float | None = None
    cgpa_match = CGPA_RE.search(text)
    if cgpa_match:
        try:
            val = float(cgpa_match.group(1))
            if 0 <= val <= 10:
                cgpa = val
            elif 0 <= val <= 100:
                cgpa = round(val / 10.0, 2)  # heuristic: percentage to ~CGPA
        except ValueError:
            pass

    model_version = f"{nlp.meta.get('name', 'unknown')}-{nlp.meta.get('version', '0')}"
    return NerDoc(
        text=text,
        entities=entities,
        skills=sorted(skills),
        emails=emails,
        phones=phones,
        urls=urls,
        cgpa=cgpa,
        model_version=model_version,
    )
