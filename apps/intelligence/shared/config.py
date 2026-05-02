"""Shared settings loaded from env. One source of truth across all 3 services."""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.intelligence"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Postgres ---
    pg_dsn: str = Field(default="postgres://orbiton:orbiton@localhost:5432/orbiton")
    pg_ro_dsn: str = Field(default="postgres://orbiton_ro:orbiton_ro@localhost:5432/orbiton")

    # --- Redis (Celery broker + BullMQ shared broker) ---
    redis_url: str = Field(default="redis://localhost:6379/0")

    # --- Node API + webhook security ---
    node_api_base_url: str = Field(default="http://localhost:5000")
    internal_hmac_secret: str = Field(default="dev-only-change-me")

    # --- Embeddings ---
    embedding_provider: Literal["sentence_transformers", "openai"] = "sentence_transformers"
    embedding_model: str = "sentence-transformers/all-mpnet-base-v2"
    embedding_dim: int = 768
    openai_api_key: str | None = None

    # --- Resume parsing ---
    spacy_model: str = "en_core_web_trf"
    resume_storage_backend: Literal["local", "s3", "gridfs"] = "local"
    resume_storage_local_path: str = "/var/orbiton/resumes"
    s3_bucket: str | None = None
    s3_region: str | None = None

    # --- Prediction ---
    prediction_model_path: str = "/app/prediction_service/models/current"
    prediction_preview_mode: bool = True

    # --- Logging ---
    log_level: str = "INFO"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
