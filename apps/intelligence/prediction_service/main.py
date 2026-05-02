"""FastAPI entrypoint for the prediction service."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from shared.observability import configure_logging, get_logger

from . import PREDICTION_VERSION
from .api.routes import router as predict_router

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    # Warm the joblib model at boot so first request is fast.
    from .pipeline.infer import get_predictor

    try:
        get_predictor()
    except Exception as exc:  # noqa: BLE001
        log.warning("predictor.warmup_failed", error=str(exc))
    log.info("prediction_service.boot", version=PREDICTION_VERSION)
    yield
    log.info("prediction_service.shutdown")


app = FastAPI(
    title="Orbiton Prediction Service",
    version=PREDICTION_VERSION,
    description="Random Forest placement-readiness scoring with SHAP explanations.",
    lifespan=lifespan,
)
app.include_router(predict_router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "prediction_service", "version": PREDICTION_VERSION}
