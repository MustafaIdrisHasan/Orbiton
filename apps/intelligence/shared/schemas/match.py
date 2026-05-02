"""Schemas for the matching service."""
from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, conlist


class StudentVector(BaseModel):
    student_id: UUID
    embedding: list[float]
    skills_normalized: list[str] = Field(default_factory=list)
    cgpa: float | None = None
    experience_years: float | None = None


class DriveVector(BaseModel):
    drive_id: UUID
    embedding: list[float]
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    min_cgpa: float | None = None
    min_experience_years: float | None = None


class BooleanGate(BaseModel):
    """Result of the strict-filter step."""
    passes: bool
    failed_reasons: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)


class MatchExplanation(BaseModel):
    """Per-student explanation appended to every match result.

    This is the 'why' panel rendered in the UI — never return a score
    without an explanation."""
    cosine_similarity: float
    skill_jaccard: float
    experience_fit: float
    cgpa_fit: float
    matched_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    extra_preferred_skills: list[str] = Field(default_factory=list)
    boolean_pass: bool
    rationale: str = ""  # short human-readable summary


class MatchResult(BaseModel):
    student_id: UUID
    drive_id: UUID
    composite_score: float
    boolean_pass: bool
    explanations: MatchExplanation
    model_version: str


class MatchResultList(BaseModel):
    drive_id: UUID
    results: list[MatchResult]
    model_version: str
    weights_used: dict[str, float]


class MatchRequest(BaseModel):
    """Body for POST /v1/match — Node sends pre-fetched student + drive context."""
    drive: DriveVector
    students: conlist(StudentVector, min_length=1, max_length=500)
    weights: dict[str, float] | None = None  # optional override per institution
