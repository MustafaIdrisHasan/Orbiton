"""Pure-function tests for features.py — no model load required."""
from __future__ import annotations

from prediction_service.pipeline.features import (
    DEPARTMENTS,
    FEATURE_ORDER,
    features_to_vector,
)
from shared.schemas import StudentFeatures


def test_feature_vector_length_matches_order():
    f = StudentFeatures(cgpa=8.0, department="CSE")
    vec = features_to_vector(f)
    assert len(vec) == len(FEATURE_ORDER)


def test_unknown_department_falls_back_to_OTHER():
    f = StudentFeatures(cgpa=8.0, department="QUANTUM_ALCHEMY")
    vec = features_to_vector(f)
    other_idx = FEATURE_ORDER.index("dept_OTHER")
    assert vec[other_idx] == 1.0


def test_one_dept_hot_at_a_time():
    f = StudentFeatures(cgpa=8.0, department="ECE")
    vec = features_to_vector(f)
    dept_cols = [vec[FEATURE_ORDER.index(f"dept_{d}")] for d in DEPARTMENTS]
    assert sum(dept_cols) == 1.0
    assert dept_cols[DEPARTMENTS.index("ECE")] == 1.0
