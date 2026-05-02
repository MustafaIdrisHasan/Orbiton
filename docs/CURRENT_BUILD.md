# Orbiton — current build snapshot

This document describes the **state of the repository as a buildable system**: workspace layout, versions, runtimes, default ports, and how to run production builds locally. For first-time setup details, see [START.md](./START.md). For product scope and handover, see [HANDOVER.md](./HANDOVER.md).

## Monorepo

| Field | Value |
|--------|--------|
| **Root package** | `orbiton-full@0.1.0` (private) |
| **Workspaces** | `apps/*`, `packages/*` |
| **Package manager** | npm (workspaces) |

## Applications and packages (high level)

| Area | Path | Role |
|------|------|------|
| Web | `apps/web` (`@orbiton/web`) | React 18, Vite 5, React Router 6 |
| API | `apps/api` (`@orbiton/api`) | Express, CommonJS, TypeORM/pg, feature-flagged services |
| ML helper | `apps/ml-service` | Python Flask-style entry (`app.py`), resume/ML pipeline helpers |
| Intelligence stack | `apps/intelligence` | FastAPI services (resume, matching, prediction); Python ≥3.11; optional Docker |
| API contract | `packages/openapi` | OpenAPI spec |
| UI / config / test utils | `packages/ui`, `packages/config`, `packages/test-utils` | Shared pieces |

## Runtime versions (target)

- **Node.js:** LTS (use current Node LTS for development; not pinned in-repo).
- **Python:** 3.x for `apps/ml-service`; **≥3.11** for `apps/intelligence` per `pyproject.toml`.
- **Databases / infra (optional for full features):** PostgreSQL (see Docker Compose in `infrastructure/docker`), Redis URL support in API config, MongoDB referenced in `apps/api/.env.example` for some flows.

## Default ports (local dev)

| Service | Default URL / port | Notes |
|---------|-------------------|--------|
| Web (Vite) | `http://localhost:5173` | May shift if 5173 is taken |
| API | `http://localhost:5000` | `PORT` in `apps/api/.env` |
| ML service (root script) | `http://localhost:8000` | `npm run dev:ml` → `python apps/ml-service/app.py`; align `ML_SERVICE_URL` in API |

## Root npm scripts

| Script | What it does |
|--------|----------------|
| `npm run dev:stack` | API + web together via `concurrently` (one terminal) |
| `npm run dev:stack:pair` | API + Vite on **5173** + Vite on **5174** — use one port per role so `localStorage` does not overwrite (TPO vs student at the same time) |
| `npm run dev:web:alt` | Second UI on port **5174** (pair with `dev:api`) |
| `npm run dev:web` | Vite dev server for `@orbiton/web` |
| `npm run dev:api` | `node src/server.js` for `@orbiton/api` |
| `npm run dev:ml` | Python ML service at repo default path |
| `npm test` | Runs `test` in all workspaces that define it |
| `npm run docker:postgres-up` | Starts Postgres via `infrastructure/docker/docker-compose.yml` |
| `npm run docker:postgres-down` | Stops that Postgres service |
| `npm run docker:db-bootstrap` | DB bootstrap via `scripts/docker-db-bootstrap.js` |

Workspace-specific scripts (examples):

- `apps/web`: `dev`, `build` (`vite build`), `preview`, tests.
- `apps/api`: `dev` / `start`, `test`, `db:bootstrap`, `db:migrate`, `seed:auth`, etc.

## Building for production (frontend)

From the repository root, after `npm install`:

```bash
npm run build --workspace @orbiton/web
```

Output is produced under `apps/web/dist` (standard Vite). Serve that folder with any static host; point the app at the real API base URL and CORS as appropriate.

## API “build”

The API runs **without a separate compile step** (plain Node). Production-style run:

```bash
npm run start --workspace @orbiton/api
```

Requires valid environment (see `apps/api/.env.example`).

## Environment highlights (`apps/api`)

Loaded via `dotenv` and `apps/api/src/config/env.js` (simplified):

- `PORT`, `CORS_ORIGIN`, `JWT_SECRET`, `POSTGRES_URL` / `DATABASE_URL`, `MONGO_URL`, `ML_SERVICE_URL`
- Optional intelligence URLs: `RESUME_SERVICE_URL`, `MATCHING_SERVICE_URL`, `PREDICTION_SERVICE_URL`, `REDIS_URL`
- Feature flags: `USE_POSTGRES`, `ENABLE_RESUME_SCORING`, `ENABLE_MATCHING`, `ENABLE_PREDICTION`, `USE_PGVECTOR_MATCHING` (treat as string `"true"` to enable)

## Tests

- Root: `npm test` (aggregates workspace tests where defined).
- API: `node --test` on `src/tests/*.test.js`.
- Web: small Node test(s) in `src/shared/api/`.

## Operating system notes (Windows / PowerShell)

If the repository path contains characters like `$`, quote paths or use `Set-Location -LiteralPath` when changing directories. See [START.md](./START.md#5-paths-with-special-characters-powershell).

## Document date

This snapshot matches the **current** repository layout and `package.json` files as of the last update to this file; re-verify versions after major dependency changes.
