"""Load the joblib model and serve predictions with SHAP-based explanations."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np

from shared.config import get_settings
from shared.observability import get_logger
from shared.schemas import (
    FeatureContribution,
    PredictionRequest,
    PredictionResult,
)

from .. import PREDICTION_VERSION
from .features import FEATURE_ORDER, features_to_vector

log = get_logger(__name__)


def _band(prob: float) -> str:
    if prob >= 0.7:
        return "high"
    if prob >= 0.4:
        return "medium"
    return "low"


def _rationale(prob: float, top: list[FeatureContribution]) -> str:
    band = _band(prob)
    if not top:
        return f"Predicted readiness band: {band} (probability {prob:.2f})."
    head = ", ".join(f"{c.feature}({'+' if c.contribution >= 0 else ''}{c.contribution:.2f})"
                     for c in top[:3])
    return (
        f"Predicted readiness: {band} (P={prob:.2f}). "
        f"Top contributors: {head}."
    )


class Predictor:
    def __init__(self, model_dir: Path):
        rf_path = model_dir / "rf.joblib"
        if not rf_path.exists():
            raise FileNotFoundError(rf_path)
        self.clf = joblib.load(rf_path)
        self.model_dir = model_dir

        order_path = model_dir / "feature_order.json"
        self.feature_order = (
            json.loads(order_path.read_text()) if order_path.exists() else FEATURE_ORDER
        )

        # SHAP TreeExplainer is fast for RandomForest and gives signed contributions.
        # Lazy import — keeps cold start light if SHAP isn't installed in some envs.
        try:
            import shap

            self._shap = shap.TreeExplainer(self.clf)
        except Exception as exc:  # noqa: BLE001
            log.warning("shap.unavailable", error=str(exc))
            self._shap = None

    def predict(self, req: PredictionRequest) -> PredictionResult:
        vec = features_to_vector(req.features).reshape(1, -1)
        prob = float(self.clf.predict_proba(vec)[0, 1])

        contributions: list[FeatureContribution] = []
        if self._shap is not None:
            # shap_values for binary classifier returns [class0, class1]; we want class1.
            try:
                sv = self._shap.shap_values(vec)
                if isinstance(sv, list):
                    sv = sv[1]
                vals = np.asarray(sv).reshape(-1)
                # Top-N by absolute magnitude
                pairs = list(zip(self.feature_order, vec.flatten().tolist(), vals.tolist()))
                pairs.sort(key=lambda t: abs(t[2]), reverse=True)
                for name, value, contrib in pairs[:8]:
                    contributions.append(
                        FeatureContribution(
                            feature=name,
                            value=value,
                            contribution=float(contrib),
                        )
                    )
            except Exception as exc:  # noqa: BLE001
                log.warning("shap.compute_failed", error=str(exc))

        # Fallback: tree feature_importances_ (global, not per-instance) if SHAP failed.
        if not contributions and hasattr(self.clf, "feature_importances_"):
            importances = self.clf.feature_importances_
            pairs = list(zip(self.feature_order, vec.flatten().tolist(), importances.tolist()))
            pairs.sort(key=lambda t: t[2], reverse=True)
            for name, value, imp in pairs[:8]:
                contributions.append(
                    FeatureContribution(feature=name, value=value, contribution=float(imp))
                )

        settings = get_settings()
        return PredictionResult(
            student_id=req.student_id,
            probability=prob,
            risk_band=_band(prob),  # type: ignore[arg-type]
            feature_contributions=contributions,
            features_snapshot=req.features,
            model_version=PREDICTION_VERSION,
            preview=settings.prediction_preview_mode,
            rationale=_rationale(prob, contributions),
        )


@lru_cache(maxsize=1)
def get_predictor() -> Predictor:
    settings = get_settings()
    return Predictor(Path(settings.prediction_model_path))
