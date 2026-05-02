"""Composite scoring for a (drive, [students]) batch.

  composite = w_cos * cosine
            + w_skill * skill_jaccard
            + w_exp * experience_fit
            + w_cgpa * cgpa_fit

`cosine` is computed in this service (treats inputs as already L2-normalized
vectors when produced by our embedder; we normalize defensively just in case).
"""
from __future__ import annotations

from typing import Iterable

import numpy as np

from shared.schemas import (
    DriveVector,
    MatchExplanation,
    MatchRequest,
    MatchResult,
    MatchResultList,
    StudentVector,
)

from .. import MATCHING_VERSION
from .boolean_filter import evaluate as boolean_evaluate
from .explainer import build_rationale

DEFAULT_WEIGHTS: dict[str, float] = {
    "cosine": 0.55,
    "skill_jaccard": 0.25,
    "experience_fit": 0.10,
    "cgpa_fit": 0.10,
}


def _normalize(v: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(v)
    return v / n if n else v


def cosine_similarity(a: list[float], b: list[float]) -> float:
    av = _normalize(np.asarray(a, dtype="float32"))
    bv = _normalize(np.asarray(b, dtype="float32"))
    return float(np.clip(np.dot(av, bv), -1.0, 1.0))


def jaccard(a: Iterable[str], b: Iterable[str]) -> float:
    sa = {s.lower().strip() for s in a if s}
    sb = {s.lower().strip() for s in b if s}
    if not sa and not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def experience_fit(student_yrs: float | None, min_yrs: float | None) -> float:
    """1.0 when student meets or exceeds min; 0..1 ramp below min; 1.0 if
    no requirement specified."""
    if min_yrs is None or min_yrs <= 0:
        return 1.0
    if student_yrs is None:
        return 0.0
    return float(min(1.0, student_yrs / min_yrs))


def cgpa_fit(student_cgpa: float | None, min_cgpa: float | None) -> float:
    if min_cgpa is None or min_cgpa <= 0:
        return 1.0
    if student_cgpa is None:
        return 0.0
    return float(min(1.0, student_cgpa / min_cgpa))


def _resolve_weights(override: dict[str, float] | None) -> dict[str, float]:
    if not override:
        return DEFAULT_WEIGHTS
    weights = {**DEFAULT_WEIGHTS, **override}
    total = sum(weights.values())
    if total <= 0:
        return DEFAULT_WEIGHTS
    # Renormalize so weights sum to 1 even if caller supplies arbitrary numbers.
    return {k: v / total for k, v in weights.items()}


def score_one(student: StudentVector, drive: DriveVector, weights: dict[str, float]) -> MatchResult:
    cos = cosine_similarity(student.embedding, drive.embedding)
    sk_jaccard = jaccard(student.skills_normalized, drive.required_skills + drive.preferred_skills)
    exp_fit = experience_fit(student.experience_years, drive.min_experience_years)
    cgpa = cgpa_fit(student.cgpa, drive.min_cgpa)

    composite = (
        weights["cosine"] * cos
        + weights["skill_jaccard"] * sk_jaccard
        + weights["experience_fit"] * exp_fit
        + weights["cgpa_fit"] * cgpa
    )
    composite = float(max(0.0, min(1.0, composite)))

    gate = boolean_evaluate(student, drive)
    matched_skills = sorted(
        {s.lower() for s in student.skills_normalized}
        & {s.lower() for s in drive.required_skills + drive.preferred_skills}
    )
    extra_pref = sorted(
        {s.lower() for s in student.skills_normalized}
        & {s.lower() for s in drive.preferred_skills}
    )

    explanations = MatchExplanation(
        cosine_similarity=cos,
        skill_jaccard=sk_jaccard,
        experience_fit=exp_fit,
        cgpa_fit=cgpa,
        matched_skills=matched_skills,
        missing_required_skills=gate.missing_required_skills,
        extra_preferred_skills=extra_pref,
        boolean_pass=gate.passes,
        rationale=build_rationale(
            cos=cos,
            sk_jaccard=sk_jaccard,
            exp_fit=exp_fit,
            cgpa_fit=cgpa,
            gate=gate,
            matched=matched_skills,
        ),
    )
    return MatchResult(
        student_id=student.student_id,
        drive_id=drive.drive_id,
        composite_score=composite,
        boolean_pass=gate.passes,
        explanations=explanations,
        model_version=MATCHING_VERSION,
    )


def score_match_request(req: MatchRequest) -> MatchResultList:
    weights = _resolve_weights(req.weights)
    results = [score_one(s, req.drive, weights) for s in req.students]
    # Sort: passers first, then by composite desc
    results.sort(key=lambda r: (not r.boolean_pass, -r.composite_score))
    return MatchResultList(
        drive_id=req.drive.drive_id,
        results=results,
        model_version=MATCHING_VERSION,
        weights_used=weights,
    )
