"""HTTP routes for the matching service.

POST /v1/embed       — generate one or more embeddings (used during profile
                       updates and drive create/edit; idempotent)
POST /v1/match       — score a drive against N candidate students. Caller
                       (Node) is expected to have already done the boolean
                       prefilter via SQL when N is large.
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from shared.observability import get_logger
from shared.schemas import MatchRequest, MatchResultList

from ..pipeline.embedder import get_embedder
from ..pipeline.scorer import score_match_request

log = get_logger(__name__)
router = APIRouter(tags=["matching"])


class EmbedRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=512)


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    dim: int


@router.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest) -> EmbedResponse:
    embedder = get_embedder()
    vectors = embedder.embed(req.texts)
    return EmbedResponse(
        embeddings=vectors,
        model=embedder.model_name,
        dim=embedder.dim,
    )


@router.post("/match", response_model=MatchResultList)
async def match(req: MatchRequest) -> MatchResultList:
    log.info(
        "match.request",
        drive_id=str(req.drive.drive_id),
        candidates=len(req.students),
    )
    return score_match_request(req)
