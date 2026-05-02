"""HTTP routes for the resume service.

POST /v1/parse        -> enqueue an async parse, return 202 + job_id
GET  /v1/parse/{id}   -> poll status (Celery result backend)
POST /v1/parse/sync   -> synchronous parse (debug only; not for prod use)
"""
from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from shared.observability import get_logger

from ..pipeline.extract import extract_text
from ..pipeline.ner import run_ner
from ..pipeline.normalize import to_json_resume
from ..pipeline.storage import load_resume_bytes
from ..workers.tasks import parse_resume_task

log = get_logger(__name__)
router = APIRouter(tags=["resume"])


class ParseEnqueueRequest(BaseModel):
    resume_id: UUID
    file_uri: str = Field(
        ...,
        description="Storage URI: file:///, s3://, or gridfs://<id>",
    )


class ParseEnqueueResponse(BaseModel):
    job_id: str
    resume_id: UUID
    status: str = "queued"


@router.post(
    "/parse",
    response_model=ParseEnqueueResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def enqueue_parse(req: ParseEnqueueRequest) -> ParseEnqueueResponse:
    """Enqueue a parse job. Worker will POST the result back to Node."""
    job_id = str(uuid4())
    parse_resume_task.apply_async(
        args=[str(req.resume_id), req.file_uri, job_id],
        task_id=job_id,
    )
    log.info("parse.enqueued", resume_id=str(req.resume_id), job_id=job_id)
    return ParseEnqueueResponse(job_id=job_id, resume_id=req.resume_id)


class SyncParseResponse(BaseModel):
    resume_id: UUID
    json_resume: dict
    raw_text_chars: int
    parse_version: str
    model_version: str


@router.post(
    "/parse/sync",
    response_model=SyncParseResponse,
    summary="Synchronous parse (debug only)",
)
async def parse_sync(req: ParseEnqueueRequest) -> SyncParseResponse:
    """Run the pipeline inline. Useful for tests; do not call from prod."""
    raw = await load_resume_bytes(req.file_uri)
    text = extract_text(raw)
    ner_doc = run_ner(text)
    resume = to_json_resume(text=text, ner_doc=ner_doc)
    from .. import PIPELINE_VERSION  # local import to avoid cycle

    return SyncParseResponse(
        resume_id=req.resume_id,
        json_resume=resume.model_dump(mode="json"),
        raw_text_chars=len(text),
        parse_version=PIPELINE_VERSION,
        model_version=ner_doc.model_version,
    )


class ParseStatusResponse(BaseModel):
    job_id: str
    state: str
    info: dict | None = None


@router.get("/parse/{job_id}", response_model=ParseStatusResponse)
async def parse_status(job_id: str) -> ParseStatusResponse:
    from ..workers.celery_app import celery_app

    result = celery_app.AsyncResult(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="unknown job_id")
    info: dict | None = None
    if result.info and isinstance(result.info, dict):
        info = result.info
    elif result.failed():
        info = {"error": str(result.info)}
    return ParseStatusResponse(job_id=job_id, state=result.state, info=info)
