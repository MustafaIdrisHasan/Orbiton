"""HMAC-SHA256 signing for Python -> Node webhooks (and vice versa).

Wire format on the request:
  X-Orbiton-Timestamp: <unix-seconds>
  X-Orbiton-Signature: sha256=<hex digest of HMAC(secret, "<ts>.<raw_body>")>

Both sides MUST use the canonical raw body bytes. Replay window: 5 minutes.
"""
from __future__ import annotations

import hashlib
import hmac
import time

REPLAY_WINDOW_SECONDS = 5 * 60


def sign_payload(secret: str, body: bytes, timestamp: int | None = None) -> tuple[str, str]:
    """Return (timestamp_str, signature_header_value)."""
    ts = timestamp if timestamp is not None else int(time.time())
    msg = f"{ts}.".encode() + body
    digest = hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()
    return str(ts), f"sha256={digest}"


def verify_signature(
    secret: str,
    body: bytes,
    timestamp_header: str | None,
    signature_header: str | None,
    *,
    now: int | None = None,
) -> bool:
    if not timestamp_header or not signature_header:
        return False
    try:
        ts = int(timestamp_header)
    except ValueError:
        return False
    current = now if now is not None else int(time.time())
    if abs(current - ts) > REPLAY_WINDOW_SECONDS:
        return False

    expected_ts, expected_sig = sign_payload(secret, body, ts)
    # Constant-time compare
    return hmac.compare_digest(expected_sig, signature_header)
