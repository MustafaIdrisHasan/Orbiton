"""JSON Resume schema (jsonresume.org) — Pydantic models.

We follow the open-source standard so Orbiton resumes are interoperable
with external tooling. The parser pipeline normalizes spaCy NER output
into this shape.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator


class Location(BaseModel):
    address: str | None = None
    postalCode: str | None = None
    city: str | None = None
    countryCode: str | None = None
    region: str | None = None


class Profile(BaseModel):
    network: str | None = None
    username: str | None = None
    url: HttpUrl | str | None = None


class Basics(BaseModel):
    name: str | None = None
    label: str | None = None
    email: EmailStr | str | None = None
    phone: str | None = None
    url: HttpUrl | str | None = None
    summary: str | None = None
    location: Location | None = None
    profiles: list[Profile] = Field(default_factory=list)


class WorkExperience(BaseModel):
    name: str | None = None              # company
    position: str | None = None
    url: HttpUrl | str | None = None
    startDate: str | None = None         # ISO-ish; we keep flexible
    endDate: str | None = None
    summary: str | None = None
    highlights: list[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str | None = None
    url: HttpUrl | str | None = None
    area: str | None = None              # e.g., Computer Science
    studyType: str | None = None         # e.g., Bachelor / B.Tech
    startDate: str | None = None
    endDate: str | None = None
    score: str | None = None             # CGPA stored as string per JSON Resume
    courses: list[str] = Field(default_factory=list)


class Skill(BaseModel):
    name: str
    level: str | None = None
    keywords: list[str] = Field(default_factory=list)


class Project(BaseModel):
    name: str | None = None
    description: str | None = None
    highlights: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    startDate: str | None = None
    endDate: str | None = None
    url: HttpUrl | str | None = None


class Certificate(BaseModel):
    name: str | None = None
    date: str | None = None
    issuer: str | None = None
    url: HttpUrl | str | None = None


class Language(BaseModel):
    language: str
    fluency: str | None = None


class JsonResume(BaseModel):
    """Top-level JSON Resume document."""
    basics: Basics = Field(default_factory=Basics)
    work: list[WorkExperience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    skills: list[Skill] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    certificates: list[Certificate] = Field(default_factory=list)
    languages: list[Language] = Field(default_factory=list)

    # Orbiton-specific extension namespace — keeps us schema-compliant
    # while letting us attach derived signals (parse confidence, etc.).
    meta: dict[str, Any] = Field(default_factory=dict)

    @field_validator("skills")
    @classmethod
    def _dedupe_skills(cls, v: list[Skill]) -> list[Skill]:
        seen: set[str] = set()
        out: list[Skill] = []
        for s in v:
            key = (s.name or "").strip().lower()
            if key and key not in seen:
                seen.add(key)
                out.append(s)
        return out
