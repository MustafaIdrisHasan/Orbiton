"""Embedding provider abstraction.

Two backends:
  - sentence_transformers (default): local CPU, fully self-hosted.
                                     Default model: all-mpnet-base-v2 (768d).
  - openai: text-embedding-3-small (1536d). Needs OPENAI_API_KEY.

Switching backends is config-only. The embedding dimension stored in
Postgres (vector(N)) MUST match `EMBEDDING_DIM` in env.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from functools import lru_cache

from shared.config import get_settings
from shared.observability import get_logger

log = get_logger(__name__)


class Embedder(ABC):
    model_name: str
    dim: int

    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]: ...

    def warmup(self) -> None:
        try:
            self.embed(["warmup"])
        except Exception as exc:  # noqa: BLE001
            log.warning("embedder.warmup_failed", error=str(exc))


class SentenceTransformerEmbedder(Embedder):
    def __init__(self, model_name: str, expected_dim: int):
        # Lazy import to avoid loading torch when only the OpenAI path is used.
        from sentence_transformers import SentenceTransformer

        self.model_name = model_name
        self._model = SentenceTransformer(model_name)
        self.dim = self._model.get_sentence_embedding_dimension() or expected_dim
        if self.dim != expected_dim:
            log.warning(
                "embedder.dim_mismatch",
                expected=expected_dim,
                actual=self.dim,
                model=model_name,
            )

    def embed(self, texts: list[str]) -> list[list[float]]:
        # normalize_embeddings=True → cosine similarity == dot product
        out = self._model.encode(
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return [vec.tolist() for vec in out]


class OpenAIEmbedder(Embedder):
    def __init__(self, model_name: str, expected_dim: int, api_key: str):
        from openai import OpenAI  # type: ignore

        self.model_name = model_name
        self.dim = expected_dim
        self._client = OpenAI(api_key=api_key)

    def embed(self, texts: list[str]) -> list[list[float]]:
        # OpenAI returns L2-normalized vectors already; we still normalize
        # defensively so `vector_cosine_ops` matches.
        import numpy as np

        resp = self._client.embeddings.create(model=self.model_name, input=texts)
        vectors = [np.array(d.embedding, dtype="float32") for d in resp.data]
        normed = []
        for v in vectors:
            n = np.linalg.norm(v)
            normed.append((v / n).tolist() if n else v.tolist())
        return normed


@lru_cache(maxsize=1)
def get_embedder() -> Embedder:
    s = get_settings()
    if s.embedding_provider == "openai":
        if not s.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY not set but embedding_provider=openai")
        return OpenAIEmbedder(s.embedding_model, s.embedding_dim, s.openai_api_key)
    return SentenceTransformerEmbedder(s.embedding_model, s.embedding_dim)
