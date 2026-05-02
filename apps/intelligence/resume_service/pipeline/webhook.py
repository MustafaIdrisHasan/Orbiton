"""Resume-service webhook helper. Posts parse results back to the Node API."""
from __future__ import annotations

from typing import Any

from shared.http import post_signed
from shared.observability import get_logger

log = get_logger(__name__)

NODE_PARSE_CALLBACK_PATH = "/api/v1/internal/resumes/parse-callback"


async def post_parse_result(payload: dict[str, Any]) -> None:
    try:
        await post_signed(NODE_PARSE_CALLBACK_PATH, payload)
    except Exception as exc:
        log.error("parse.webhook_failed", error=str(exc))
        raise
