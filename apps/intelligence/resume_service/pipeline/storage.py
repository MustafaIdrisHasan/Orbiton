"""Storage adapter: load resume bytes from local disk, S3, or GridFS.

The Node API decides where files live; this service only reads. We accept
URI-style strings:
  - file:///var/orbiton/resumes/<id>.pdf
  - s3://bucket/key
  - gridfs://<object_id>     (MongoDB GridFS)
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from urllib.parse import urlparse

from shared.config import get_settings
from shared.observability import get_logger

log = get_logger(__name__)


async def load_resume_bytes(uri: str) -> bytes:
    """Async fetch."""
    parsed = urlparse(uri)
    scheme = parsed.scheme or "file"

    if scheme == "file":
        return await asyncio.to_thread(_read_local, parsed.path)
    if scheme == "s3":
        return await asyncio.to_thread(_read_s3, parsed.netloc, parsed.path.lstrip("/"))
    if scheme == "gridfs":
        return await _read_gridfs(parsed.netloc + parsed.path)
    raise ValueError(f"unsupported_storage_scheme: {scheme}")


def load_resume_bytes_sync(uri: str) -> bytes:
    """Sync version for Celery workers."""
    return asyncio.run(load_resume_bytes(uri))


def _read_local(path: str) -> bytes:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(path)
    return p.read_bytes()


def _read_s3(bucket: str, key: str) -> bytes:
    # Lazy import — boto3 is optional unless S3 backend is selected.
    import boto3  # type: ignore

    settings = get_settings()
    client = boto3.client("s3", region_name=settings.s3_region)
    obj = client.get_object(Bucket=bucket, Key=key)
    return obj["Body"].read()


async def _read_gridfs(object_id: str) -> bytes:
    # Optional dependency. Installed only if GridFS backend is selected.
    from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore
    from bson import ObjectId  # type: ignore

    settings = get_settings()
    # Mongo URL would normally come from settings; for now we expect
    # MONGO_URL env var here as a thin override.
    import os
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    fs = client.get_default_database().get_collection("fs.files")  # placeholder
    doc = await fs.find_one({"_id": ObjectId(object_id)})
    if not doc:
        raise FileNotFoundError(f"gridfs:{object_id}")
    # Real GridFS read is more involved; this is a stub for the local path.
    return doc.get("data", b"")
