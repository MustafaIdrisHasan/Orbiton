"""Helper for posting signed JSON to the Node API webhook receiver."""
from __future__ import annotations

import json
from typing import Any

import httpx

from shared.config import get_settings
from shared.observability import get_logger
from shared.security import sign_payload

log = get_logger(__name__)


async def post_signed(
    path: str,
    payload: dict[str, Any],
    *,
    timeout: float = 10.0,
) -> httpx.Response:
    """POST `payload` to {NODE_API_BASE_URL}{path} with HMAC headers."""
    settings = get_settings()
    body = json.dumps(payload, separators=(",", ":"), default=str).encode()
    ts, sig = sign_payload(settings.internal_hmac_secret, body)

    url = f"{settings.node_api_base_url.rstrip('/')}{path}"
    headers = {
        "Content-Type": "application/json",
        "X-Orbiton-Timestamp": ts,
        "X-Orbiton-Signature": sig,
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, content=body, headers=headers)
    log.info(
        "webhook.posted",
        path=path,
        status=resp.status_code,
        bytes=len(body),
    )
    resp.raise_for_status()
    return resp
