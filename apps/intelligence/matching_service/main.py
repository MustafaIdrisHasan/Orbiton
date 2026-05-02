"""FastAPI entrypoint for the matching service."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from shared.observability import configure_logging, get_logger

from . import MATCHING_VERSION
from .api.routes import router as match_router

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    # Pre-load the embedding model so first request isn't 5s slow
    from .pipeline.embedder import get_embedder

    get_embedder().warmup()
    log.info("matching_service.boot", version=MATCHING_VERSION)
    yield
    log.info("matching_service.shutdown")


app = FastAPI(
    title="Orbiton Matching Service",
    version=MATCHING_VERSION,
    description="Embedding generation + composite job-profile matching with explainability.",
    lifespan=lifespan,
)
app.include_router(match_router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "matching_service", "version": MATCHING_VERSION}
