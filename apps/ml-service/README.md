# Orbiton ML Service

Flask scaffold for **future** model-backed endpoints. The main API (Express) is the public contract; this service is called over HTTP from the API when a model is ready (or behind feature flags). This repo does not ship trained weights—only the runtime and dependency pins (e.g. scikit-learn in `requirements.txt`).

**Spec and methodology:** see [docs/ML_PRODUCT_SPEC.md](../../docs/ML_PRODUCT_SPEC.md) (weighted resume scoring, vector + cosine matching, placement prediction baseline). **Project context and integration:** [docs/HANDOVER.md](../../docs/HANDOVER.md) and the intelligence epics in [docs/ROADMAP.md](../../docs/ROADMAP.md).

## Run locally

From the monorepo root: `npm run dev:ml` (runs `python apps/ml-service/app.py`). Service listens on **port 8000** (`0.0.0.0`).

Or from this directory: `python app.py` (with the project venv / `pip install -r requirements.txt` as needed).

## Current routes

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Liveness |
| GET | `/v1/status` | Lists **planned** capabilities: `resume-analysis-planned`, `job-matching-planned`, `placement-prediction-planned` |

## Suggested next HTTP endpoints (to align with the API in OpenAPI and `ML_PRODUCT_SPEC`)

Implement these (or similar) on this service when models exist; the Express layer would proxy or enqueue work and return stable JSON to the web app:

1. **Resume analysis** — `POST /v1/resume/analyze` (body: text or `resumeId` the API has stored); response: per-feature subscores and aggregate (maps to `resume_scores` / weight table in the spec).
2. **Job / drive matching** — `POST /v1/match` (body: student profile embedding inputs + job/drive spec); response: similarity score and optional top-k explanations.
3. **Placement prediction** — `POST /v1/predict/placement` (body: feature vector for a student, optional context); response: probability and model version for governance.

Update `GET /v1/status` to reflect which of the above are **live** versus **beta** as you ship. Keep [packages/openapi/openapi.yaml](../../packages/openapi/openapi.yaml) in sync with any user-facing paths exposed on `apps/api` rather than on this service directly.
