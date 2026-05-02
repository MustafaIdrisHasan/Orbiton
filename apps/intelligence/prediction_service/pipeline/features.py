"""Feature engineering — single source of truth for input ordering.

The Node API extracts these from PostgreSQL and ships them as a
`StudentFeatures` payload. Keep `FEATURE_ORDER` and `DEPARTMENTS` in
sync with what the trainer uses, or model loads will silently produce
nonsense.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from shared.schemas import StudentFeatures

# All known department codes, used for one-hot encoding.
# Add/remove only with a model retrain.
DEPARTMENTS: list[str] = [
    "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "BIOTECH", "MBA", "OTHER",
]

NUMERIC_FEATURES: list[str] = [
    "cgpa",
    "backlog_count",
    "internship_count",
    "hackathon_count",
    "skill_count",
    "project_count",
    "certification_count",
    "year",
    "has_internship",        # bool -> 0/1
    "communication_score",   # nullable -> filled with 5.0
    "aptitude_score",        # nullable -> filled with 50.0
]

# Final feature names in matrix order: numeric then dept_<X>
FEATURE_ORDER: list[str] = NUMERIC_FEATURES + [f"dept_{d}" for d in DEPARTMENTS]


def features_to_vector(f: StudentFeatures) -> np.ndarray:
    dept = f.department.upper().strip()
    if dept not in DEPARTMENTS:
        dept = "OTHER"
    one_hot = [1.0 if d == dept else 0.0 for d in DEPARTMENTS]
    numeric = [
        float(f.cgpa),
        float(f.backlog_count),
        float(f.internship_count),
        float(f.hackathon_count),
        float(f.skill_count),
        float(f.project_count),
        float(f.certification_count),
        float(f.year),
        1.0 if f.has_internship else 0.0,
        float(f.communication_score) if f.communication_score is not None else 5.0,
        float(f.aptitude_score) if f.aptitude_score is not None else 50.0,
    ]
    return np.asarray(numeric + one_hot, dtype="float64")


def features_to_named_dict(f: StudentFeatures) -> dict[str, Any]:
    """For SHAP / contribution display."""
    vec = features_to_vector(f)
    return dict(zip(FEATURE_ORDER, vec.tolist()))
