"""Pure-Python inference for the placement prediction baseline.

The baseline is a hand-tuned logistic regression. If a `model.joblib` is
present alongside this file, the joblib bundle (with the same shape as
`DEFAULT_COEFS`) overrides these defaults. If joblib import or load fails,
defaults are used so the Flask service still responds.
"""

from __future__ import annotations

import math
import os
from typing import Dict, Any


DEFAULT_COEFS: Dict[str, Any] = {
    "intercept": -1.5,
    "weights": {
        "resume_score": 2.0,
        "cgpa": 2.5,
        "internship": 0.8,
        "projects": 1.2,
        "backlogs": -1.5,
    },
    "model_version": "pp-v0.1.0",
    "trained_at": "synthetic-baseline",
    "feature_order": [
        "resume_score",
        "cgpa",
        "internship",
        "projects",
        "backlogs",
    ],
}


_state: Dict[str, Any] = {"coefs": DEFAULT_COEFS, "loaded_from": "default"}


def _try_load_model() -> None:
    path = os.path.join(os.path.dirname(__file__), "model.joblib")
    if not os.path.exists(path):
        return
    try:
        import joblib  # type: ignore

        bundle = joblib.load(path)
        if isinstance(bundle, dict) and "weights" in bundle:
            _state["coefs"] = bundle
            _state["loaded_from"] = path
    except Exception:
        # Silently fall back to defaults; the Flask service must keep running.
        pass


_try_load_model()


def model_info() -> Dict[str, str]:
    coefs = _state["coefs"]
    return {
        "modelVersion": coefs.get("model_version", "pp-v0.1.0"),
        "loadedFrom": _state["loaded_from"],
    }


def _normalize(payload: Dict[str, Any]) -> Dict[str, float]:
    rs_raw = payload.get("resumeScore")
    rs = max(0.0, min(1.0, float(rs_raw) / 100.0)) if rs_raw is not None else 0.0

    cgpa_raw = payload.get("cgpa")
    cgpa = max(0.0, min(1.0, (float(cgpa_raw) - 5.0) / 5.0)) if cgpa_raw is not None else 0.0

    internship = 1.0 if payload.get("hasInternship") else 0.0

    proj_raw = payload.get("projectCount")
    projects = max(0.0, min(1.0, float(proj_raw) / 4.0)) if proj_raw is not None else 0.0

    back_raw = payload.get("backlogs")
    backlogs = max(0.0, min(1.0, float(back_raw) / 3.0)) if back_raw is not None else 0.0

    return {
        "resume_score": rs,
        "cgpa": cgpa,
        "internship": internship,
        "projects": projects,
        "backlogs": backlogs,
    }


def _sigmoid(x: float) -> float:
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    z = math.exp(x)
    return z / (1.0 + z)


def predict(payload: Dict[str, Any]) -> Dict[str, Any]:
    coefs = _state["coefs"]
    weights = coefs["weights"]
    intercept = float(coefs.get("intercept", 0.0))
    features = _normalize(payload or {})

    contributions = {}
    z = intercept
    for key, value in features.items():
        w = float(weights.get(key, 0.0))
        contrib = w * value
        contributions[key] = round(contrib, 4)
        z += contrib

    probability = _sigmoid(z)

    if probability >= 0.7:
        band = "high"
    elif probability >= 0.4:
        band = "medium"
    else:
        band = "low"

    return {
        "probability": round(probability, 4),
        "riskBand": band,
        "modelVersion": coefs.get("model_version", "pp-v0.1.0"),
        "features": {k: round(v, 4) for k, v in features.items()},
        "contributions": contributions,
        "intercept": round(intercept, 4),
    }
