"""HTTP routes for the prediction service."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from shared.observability import get_logger
from shared.schemas import PredictionRequest, PredictionResult

from ..pipeline.infer import get_predictor

log = get_logger(__name__)
router = APIRouter(tags=["predictions"])


@router.post("/predict/placement", response_model=PredictionResult)
async def predict_placement(req: PredictionRequest) -> PredictionResult:
    try:
        predictor = get_predictor()
    except FileNotFoundError as exc:
        log.error("predictor.unavailable", error=str(exc))
        raise HTTPException(
            status_code=503,
            detail="prediction_model_not_loaded — run training pipeline first",
        ) from exc

    return predictor.predict(req)
