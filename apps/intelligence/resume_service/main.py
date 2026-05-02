"""FastAPI entrypoint for the resume parsing service."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from shared.observability import configure_logging, get_logger

from . import PIPELINE_VERSION
from .api.routes import router as parse_router

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    log.info("resume_service.boot", pipeline_version=PIPELINE_VERSION)
    yield
    log.info("resume_service.shutdown")


app = FastAPI(
    title="Orbiton Resume Service",
    version=PIPELINE_VERSION,
    description=(
        "Async resume parsing. POST /v1/parse enqueues a job and returns 202; "
        "the worker posts the JSON Resume back to the Node API via signed webhook."
    ),
    lifespan=lifespan,
)

app.include_router(parse_router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "resume_service", "version": PIPELINE_VERSION}
