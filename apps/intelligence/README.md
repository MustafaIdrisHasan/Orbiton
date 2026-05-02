# Orbiton Intelligence Layer (Python)

This monorepo houses the three Python microservices that power Orbiton's
intelligence features. They are designed to be **read-only against
PostgreSQL**: every state mutation flows through the Node API.

## Services

| Service              | Port | Purpose                                              |
|----------------------|------|------------------------------------------------------|
| `resume_service`     | 8001 | Async resume parsing (FastAPI + Celery worker)       |
| `matching_service`   | 8002 | Embedding generation + composite match scoring       |
| `prediction_service` | 8003 | Placement readiness Random Forest classifier         |

Each service is an independent FastAPI app sharing a common Python package
(`shared/`) for config, schemas, DB access, HMAC signing, and logging.

## Architecture rules

1. **Node owns all state.** Python services connect to Postgres with a
   read-only role (`orbiton_ro`) and post results back to Node via
   HMAC-signed webhook callbacks. No writes from Python.
2. **Decision support, not auto-decisions.** Every score / prediction
   returns an `explanations` payload describing what drove it. Predictions
   carry `model_version` and (in preview mode) a `preview: true` flag.
3. **JSON Resume schema** is the canonical resume contract. Our parser
   normalizes spaCy output into the open standard.
4. **Async by default.** The resume service replies 202 to parse jobs and
   pushes results back via webhook. Embedding refresh is queued.

## Local dev (without Docker)

```bash
cd apps/intelligence
python -m venv .venv && source .venv/bin/activate
pip install -e .[dev]
python -m spacy download en_core_web_trf   # one-time, ~500MB

# Terminal 1
uvicorn resume_service.main:app --reload --port 8001
# Terminal 2
celery -A resume_service.workers.celery_app.celery_app worker --loglevel=INFO
# Terminal 3
uvicorn matching_service.main:app --reload --port 8002
# Terminal 4
uvicorn prediction_service.main:app --reload --port 8003
```

## With Docker

```bash
cd infrastructure/docker
docker compose -f docker-compose.intelligence.yml up --build
```

## Configuration

See `.env.intelligence.example` at the repo root. All services read the
same env vars via `shared.config.Settings`.

## Tests

```bash
pytest apps/intelligence
```

## Node API integration (`apps/api`)

The Express API calls these services through `src/integrations/intelligence/`:

| Concern | Entry |
|--------|--------|
| HTTP client (all three services) | `client.js` |
| Placement: FastAPI **or** legacy Flask | `index.js` → `predictPlacement` |
| Matching: pgvector + `matching_service` | `USE_PGVECTOR_MATCHING=true` → `modules/matching/matching.service.js` |
| Internal webhooks (parse + embeddings) | `POST /api/v1/internal/*` (see `modules/internal/`) |

**Environment (see `apps/api/.env.example`):**

- `PREDICTION_SERVICE_URL` — if set, placement tries FastAPI first, then falls back to `ML_SERVICE_URL` (Flask).
- `MATCHING_SERVICE_URL`, `RESUME_SERVICE_URL` — used by `client.js` for `/v1/match`, `/v1/embed`, `/v1/parse`.
- `USE_PGVECTOR_MATCHING` — when `true`, `GET /matching/drives` and `/matching/students` use Postgres embeddings + Python composite scoring (legacy cosine path if this fails or is off).
- `INTERNAL_HMAC_SECRET` — required for Python → Node callbacks under `/api/v1/internal/`.
- `REDIS_URL` — BullMQ producers for `embedding.refresh` / `matching.precompute` (optional until workers run).

**Discovery:** `GET /api/v1/intelligence/status` (no auth) returns which URLs are configured (booleans only).

**OpenAPI:** `packages/openapi/openapi.yaml` v1.2.0+ documents `/predictions/placement`, `/intelligence/status`, and `/internal/*` webhooks.
