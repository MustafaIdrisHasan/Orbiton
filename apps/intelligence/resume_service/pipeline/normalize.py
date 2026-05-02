"""Normalize the NER pipeline output into a JSON Resume document.

Section detection uses a heuristic header regex over the raw text. This
covers the vast majority of student resume layouts; complex multi-column
PDFs may need additional segmentation, which is a known follow-up.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from shared.schemas.json_resume import (
    Basics,
    Education,
    JsonResume,
    Project,
    Skill,
    WorkExperience,
)

from .ner import NerDoc

# Common section headers in Indian/global student resumes.
SECTION_HEADERS = {
    "education": re.compile(r"^\s*(education|academic|qualifications?)\s*$", re.I | re.M),
    "experience": re.compile(
        r"^\s*(experience|work\s*experience|internships?|professional\s*experience)\s*$",
        re.I | re.M,
    ),
    "projects": re.compile(r"^\s*(projects?|personal\s*projects?)\s*$", re.I | re.M),
    "skills": re.compile(r"^\s*(skills?|technical\s*skills?|tech\s*stack)\s*$", re.I | re.M),
    "certifications": re.compile(
        r"^\s*(certifications?|courses?|achievements?)\s*$", re.I | re.M
    ),
}


@dataclass
class Sections:
    education: str = ""
    experience: str = ""
    projects: str = ""
    skills: str = ""
    certifications: str = ""
    other: str = ""


def _split_sections(text: str) -> Sections:
    """Split resume text into sections by header heuristics."""
    # Find all header positions
    matches: list[tuple[int, str]] = []
    for name, pattern in SECTION_HEADERS.items():
        for m in pattern.finditer(text):
            matches.append((m.start(), name))
    matches.sort()

    sections = Sections()
    if not matches:
        sections.other = text
        return sections

    # Carve text by adjacent header positions
    for i, (start, name) in enumerate(matches):
        end = matches[i + 1][0] if i + 1 < len(matches) else len(text)
        block = text[start:end]
        # Strip the header line itself
        block = re.sub(SECTION_HEADERS[name], "", block, count=1).strip()
        setattr(sections, name, block)
    return sections


# ---- Section parsers (heuristic, deliberately tolerant) ----

EDU_INSTITUTION_HINT = re.compile(
    r"(university|college|institute|institution|school|iit|nit|bits|iiit)", re.I
)
EDU_DEGREE_HINT = re.compile(
    r"(b\.?\s*tech|m\.?\s*tech|b\.?\s*e\b|m\.?\s*e\b|bachelor|master|phd|m\.?\s*sc|b\.?\s*sc|mba)",
    re.I,
)


def _parse_education(block: str, fallback_cgpa: float | None) -> list[Education]:
    if not block:
        return []
    edu: list[Education] = []
    # Split on blank lines or bullet boundaries
    chunks = [c.strip() for c in re.split(r"\n\s*\n", block) if c.strip()]
    for chunk in chunks:
        line = " ".join(l.strip() for l in chunk.splitlines() if l.strip())
        institution_m = EDU_INSTITUTION_HINT.search(line)
        degree_m = EDU_DEGREE_HINT.search(line)
        score_m = re.search(r"(?:cgpa|gpa|sgpa)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)", line, re.I)
        score: str | None = None
        if score_m:
            score = score_m.group(1)
        elif fallback_cgpa is not None:
            score = str(fallback_cgpa)
        edu.append(
            Education(
                institution=institution_m.group(0) if institution_m else None,
                studyType=degree_m.group(0) if degree_m else None,
                score=score,
                area=None,
                startDate=_first_year(line, "first"),
                endDate=_first_year(line, "last"),
            )
        )
    # Drop fully-empty rows
    return [e for e in edu if any([e.institution, e.studyType, e.score])]


def _first_year(s: str, which: str) -> str | None:
    years = re.findall(r"(19|20)\d{2}", s)
    if not years:
        return None
    return years[0] if which == "first" else years[-1]


def _parse_experience(block: str) -> list[WorkExperience]:
    if not block:
        return []
    out: list[WorkExperience] = []
    chunks = [c.strip() for c in re.split(r"\n\s*\n", block) if c.strip()]
    for chunk in chunks:
        lines = [l.strip() for l in chunk.splitlines() if l.strip()]
        if not lines:
            continue
        header = lines[0]
        # "<Position> at <Company>" or "<Company> - <Position>" patterns
        company: str | None = None
        position: str | None = None
        m = re.search(r"(.+?)\s+(?:at|@|\-|—)\s+(.+)", header)
        if m:
            position, company = m.group(1).strip(), m.group(2).strip()
        else:
            position = header
        highlights = [l.lstrip("-•*● ").strip() for l in lines[1:]]
        out.append(
            WorkExperience(
                name=company,
                position=position,
                startDate=_first_year(chunk, "first"),
                endDate=_first_year(chunk, "last"),
                highlights=highlights,
            )
        )
    return out


def _parse_projects(block: str) -> list[Project]:
    if not block:
        return []
    out: list[Project] = []
    chunks = [c.strip() for c in re.split(r"\n\s*\n", block) if c.strip()]
    for chunk in chunks:
        lines = [l.strip() for l in chunk.splitlines() if l.strip()]
        if not lines:
            continue
        out.append(
            Project(
                name=lines[0],
                description=" ".join(lines[1:]) if len(lines) > 1 else None,
                highlights=[l.lstrip("-•*● ").strip() for l in lines[1:]],
            )
        )
    return out


def _name_from_text(text: str, fallback_emails: list[str]) -> str | None:
    """Best-effort: name is usually the first non-empty line of the resume."""
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        # Skip lines that are clearly not names
        if re.search(r"@|http|\d{5,}|resume", s, re.I):
            continue
        # Take first 4 tokens at most
        tokens = s.split()
        if 1 < len(tokens) <= 6 and all(t[:1].isalpha() for t in tokens):
            return " ".join(tokens[:4])
        return None
    return None


def to_json_resume(*, text: str, ner_doc: NerDoc) -> JsonResume:
    """Compose a JsonResume from raw text + NER outputs."""
    sections = _split_sections(text)

    basics = Basics(
        name=_name_from_text(text, ner_doc.emails),
        email=ner_doc.emails[0] if ner_doc.emails else None,
        phone=ner_doc.phones[0] if ner_doc.phones else None,
        url=ner_doc.urls[0] if ner_doc.urls else None,
        summary=None,
        profiles=[],
    )

    skills_objs = [Skill(name=s) for s in ner_doc.skills]

    return JsonResume(
        basics=basics,
        skills=skills_objs,
        education=_parse_education(sections.education, fallback_cgpa=ner_doc.cgpa),
        work=_parse_experience(sections.experience),
        projects=_parse_projects(sections.projects),
        meta={
            "parser_confidence": {
                "skills": "high" if skills_objs else "low",
                "education": "medium" if sections.education else "low",
                "experience": "medium" if sections.experience else "low",
            },
            "extracted_cgpa": ner_doc.cgpa,
            "model_version": ner_doc.model_version,
        },
    )
