"""Pure-function tests for scorer logic — no model load required."""
from __future__ import annotations

from uuid import uuid4

from matching_service.pipeline.scorer import (
    cgpa_fit,
    cosine_similarity,
    experience_fit,
    jaccard,
    score_match_request,
)
from shared.schemas import DriveVector, MatchRequest, StudentVector


def test_cosine_orthogonal_is_zero():
    a = [1.0, 0.0, 0.0]
    b = [0.0, 1.0, 0.0]
    assert abs(cosine_similarity(a, b)) < 1e-6


def test_cosine_identical_is_one():
    a = [0.5, 0.5, 0.7071]
    assert abs(cosine_similarity(a, a) - 1.0) < 1e-3


def test_jaccard_basic():
    assert jaccard(["python", "fastapi"], ["python", "django"]) == 1 / 3


def test_experience_fit_meets_requirement():
    assert experience_fit(2.0, 1.0) == 1.0
    assert experience_fit(0.5, 1.0) == 0.5
    assert experience_fit(None, 1.0) == 0.0
    assert experience_fit(0.0, None) == 1.0


def test_cgpa_fit_meets_requirement():
    assert cgpa_fit(8.5, 7.0) == 1.0
    assert cgpa_fit(6.5, 7.0) < 1.0


def test_score_match_orders_passers_first():
    drive = DriveVector(
        drive_id=uuid4(),
        embedding=[1.0, 0.0, 0.0],
        required_skills=["python"],
        preferred_skills=["fastapi"],
        min_cgpa=7.0,
    )
    student_pass = StudentVector(
        student_id=uuid4(),
        embedding=[1.0, 0.0, 0.0],
        skills_normalized=["python", "fastapi"],
        cgpa=8.5,
        experience_years=1.0,
    )
    student_fail = StudentVector(
        student_id=uuid4(),
        embedding=[1.0, 0.0, 0.0],
        skills_normalized=["java"],  # missing python
        cgpa=8.5,
    )
    out = score_match_request(MatchRequest(drive=drive, students=[student_fail, student_pass]))
    assert out.results[0].boolean_pass is True
    assert out.results[1].boolean_pass is False
    assert out.results[0].composite_score >= out.results[1].composite_score
    # Each result must carry an explanation rationale
    assert out.results[0].explanations.rationale
