"""Celery tasks for resume parsing.

Each task:
  1. Pulls the file bytes from storage.
  2. Extracts text via PyMuPDF.
  3. Runs spaCy 3 transformer NER.
  4. Normalizes to JSON Resume schema.
  5. POSTs the result to Node /api/v1/internal/resumes/:id/parsed
     with HMAC-SHA256 signature headers.

If any step fails, posts a 'failed' status webhook so Node can update UI.
"""
from __future__ import annotations

import asyncio
import time
from typing import Any

from shared.observability import get_logger

from .. import PIPELINE_VERSION
from ..pipeline.extract import extract_text
from ..pipeline.ner import run_ner
from ..pipeline.normalize import to_json_resume
from ..pipeline.storage import load_resume_bytes_sync
from ..pipeline.webhook import post_parse_result
from .celery_app import celery_app

log = get_logger(__name__)


@celery_app.task(
    name="resume.parse",
    bind=True,
    max_retries=3,
    default_retry_delay=20,
)
def parse_resume_task(self, resume_id: str, file_uri: str, job_id: str) -> dict[str, Any]:
    started = time.monotonic()
    log.info("parse.started", resume_id=resume_id, job_id=job_id, file_uri=file_uri)

    try:
        raw = load_resume_bytes_sync(file_uri)
        text = extract_text(raw)
        if len(text) < 50:
            raise ValueError(f"resume_text_too_short: {len(text)} chars")

        ner_doc = run_ner(text)
        resume = to_json_resume(text=text, ner_doc=ner_doc)

        duration_ms = int((time.monotonic() - started) * 1000)
        payload = {
            "resume_id": resume_id,
            "job_id": job_id,
            "status": "succeeded",
            "json_resume": resume.model_dump(mode="json"),
            "raw_text_chars": len(text),
            "parse_version": PIPELINE_VERSION,
            "model_version": ner_doc.model_version,
            "duration_ms": duration_ms,
        }

        # Post back to Node (HMAC signed). Run async helper from sync Celery context.
        asyncio.run(post_parse_result(payload))

        log.info(
            "parse.succeeded",
            resume_id=resume_id,
            job_id=job_id,
            duration_ms=duration_ms,
            chars=len(text),
        )
        return {
            "ok": True,
            "resume_id": resume_id,
            "duration_ms": duration_ms,
        }

    except Exception as exc:
        duration_ms = int((time.monotonic() - started) * 1000)
        log.error(
            "parse.failed",
            resume_id=resume_id,
            job_id=job_id,
            error=str(exc),
            duration_ms=duration_ms,
        )
        # Best-effort failure webhook (don't double-throw)
        try:
            asyncio.run(
                post_parse_result(
                    {
                        "resume_id": resume_id,
                        "job_id": job_id,
                        "status": "failed",
                        "failure_reason": str(exc),
                        "parse_version": PIPELINE_VERSION,
                        "model_version": "unknown",
                        "duration_ms": duration_ms,
                    }
                )
            )
        except Exception as webhook_err:  # noqa: BLE001
            log.error("parse.webhook_failure_post_failed", error=str(webhook_err))
        # Retry transient errors only; treat ValueError as terminal
        if not isinstance(exc, (ValueError, FileNotFoundError)):
            raise self.retry(exc=exc)
        return {"ok": False, "error": str(exc)}
