"""Schemas for the placement prediction service."""
from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class StudentFeatures(BaseModel):
    """Inputs to the Random Forest classifier.

    Designed to be reproducible from the Postgres schema by Node's feature
    extractor. Add a field here -> add to feature_pipeline.FEATURE_ORDER ->
    bump model_version.
    """
    cgpa: float = Field(ge=0, le=10)
    backlog_count: int = Field(ge=0, default=0)
    internship_count: int = Field(ge=0, default=0)
    hackathon_count: int = Field(ge=0, default=0)
    skill_count: int = Field(ge=0, default=0)
    project_count: int = Field(ge=0, default=0)
    certification_count: int = Field(ge=0, default=0)
    department: str = "OTHER"  # one-hot encoded inside the pipeline
    year: int = Field(ge=1, le=6, default=4)
    has_internship: bool = False
    communication_score: float | None = None  # 0..10, optional
    aptitude_score: float | None = None        # 0..100, optional


class FeatureContribution(BaseModel):
    feature: str
    value: float | str | bool
    contribution: float  # SHAP value (positive => pushes towards 'placed')


class PredictionRequest(BaseModel):
    student_id: UUID
    features: StudentFeatures


class PredictionResult(BaseModel):
    student_id: UUID
    probability: float = Field(ge=0, le=1)
    risk_band: Literal["low", "medium", "high"]
    feature_contributions: list[FeatureContribution]
    features_snapshot: StudentFeatures
    model_version: str
    preview: bool = False  # true while baseline is from public data, not institutional
    rationale: str = ""
