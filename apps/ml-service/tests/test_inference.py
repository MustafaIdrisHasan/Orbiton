"""Pytest-compatible smoke tests for the placement predictor.

Run from apps/ml-service:
    pytest -q tests/

These tests use only the standard library and the local inference module
so they pass even without scikit-learn or joblib installed.
"""

from __future__ import annotations

import os
import sys

HERE = os.path.dirname(__file__)
ROOT = os.path.dirname(HERE)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from inference import predict, model_info  # noqa: E402


def test_predict_returns_documented_shape() -> None:
    result = predict(
        {
            "resumeScore": 80,
            "cgpa": 8.6,
            "hasInternship": True,
            "projectCount": 3,
            "backlogs": 0,
        }
    )
    assert "probability" in result
    assert 0.0 <= result["probability"] <= 1.0
    assert result["riskBand"] in {"low", "medium", "high"}
    assert result["modelVersion"].startswith("pp-")
    assert set(result["features"].keys()) == {
        "resume_score",
        "cgpa",
        "internship",
        "projects",
        "backlogs",
    }


def test_high_signal_profile_lands_in_high_band() -> None:
    result = predict(
        {
            "resumeScore": 95,
            "cgpa": 9.2,
            "hasInternship": True,
            "projectCount": 5,
            "backlogs": 0,
        }
    )
    assert result["probability"] >= 0.7
    assert result["riskBand"] == "high"


def test_weak_profile_lands_in_low_band() -> None:
    result = predict(
        {
            "resumeScore": 25,
            "cgpa": 5.5,
            "hasInternship": False,
            "projectCount": 0,
            "backlogs": 3,
        }
    )
    assert result["probability"] <= 0.4
    assert result["riskBand"] == "low"


def test_missing_payload_does_not_crash() -> None:
    result = predict({})
    assert "probability" in result
    assert 0.0 <= result["probability"] <= 1.0


def test_model_info_reports_version_and_loaded_from() -> None:
    info = model_info()
    assert info["modelVersion"].startswith("pp-")
    assert isinstance(info["loadedFrom"], str)
