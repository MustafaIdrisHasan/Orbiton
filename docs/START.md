# Running Orbiton locally

## Prerequisites

- **Node.js** (LTS) and **npm**
- **Python 3** (for the ML resume extractor service)
- **PostgreSQL** — easiest path is **Docker** (see below). The API also references **MongoDB** in `.env.example`; configure `MONGO_URL` if your stack expects it.

## 1. Install dependencies

From the **repository root**:

```powershell
npm install
```

## 2. API environment

Copy the example env file and edit as needed:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

Important variables (see `apps/api/.env.example` for the full list):

| Variable | Typical local value |
|----------|---------------------|
| `PORT` | `5000` |
| `JWT_SECRET` | any non-empty secret for dev |
| `POSTGRES_URL` | `postgres://orbiton:orbiton@127.0.0.1:5432/orbiton` (matches Docker compose) |
| `CORS_ORIGIN` | `http://localhost:5173` (match the Vite URL shown in the terminal) |
| `ML_SERVICE_URL` | `http://localhost:8000` (if you run the Python ML service) |

Optional feature flags: `ENABLE_RESUME_SCORING`, `ENABLE_MATCHING`, `ENABLE_PREDICTION`, `USE_POSTGRES` for resume persistence, `USE_PGVECTOR_MATCHING`, etc.

## 3. Database (Docker Postgres + bootstrap)

From the repo root, with Docker running:

```powershell
npm run docker:postgres-up
npm run docker:db-bootstrap
```

`docker:db-bootstrap` runs `db:bootstrap` in the API workspace: main schema, migrations, and **auth seed** (demo users). If you prefer to run bootstrap manually after exporting `POSTGRES_URL`:

```powershell
npm run db:bootstrap --workspace @orbiton/api
```

To **re-seed only** auth users (after DB is up):

```powershell
npm run seed:auth --workspace @orbiton/api
```

## 4. Start the stack

Use **three terminals** from the repo root.

**API** (default `http://localhost:5000`):

```powershell
npm run dev:api
```

**Web** (Vite; usually `http://localhost:5173`, or the next free port if 5173 is taken — check the terminal output):

```powershell
npm run dev:web
```

**ML service** (Flask extractor on `http://localhost:8000`):

```powershell
npm run dev:ml
```

Or, with dependencies installed in `apps/ml-service`:

```powershell
cd apps\ml-service
python app.py
```

Point the API at it with `ML_SERVICE_URL=http://localhost:8000` in `apps/api/.env`.

### TPO and student at the same time (two logins)

Two **tabs on the same URL** (`http://localhost:5173`) share **one** `localStorage`, so the last login wins. Use **separate origins**:

- From the repo root: `npm run dev:stack:pair` — starts the API plus Vite on **5173** and **5174**.
- Open **http://localhost:5173** for one role (e.g. TPO) and **http://localhost:5174** for the other (e.g. student). Each port is a different origin, so JWTs stay independent.

If you set `CORS_ORIGIN` in `apps/api/.env` to a **single** URL, add the second port (comma-separated) or **clear** `CORS_ORIGIN` in development so the API’s default allowlist includes both dev ports (see `apps/api/src/config/env.js`).

## 5. Paths with special characters (PowerShell)

If the repo path contains `$` or other characters, quote paths or use `Set-Location -LiteralPath` before running commands.

## 6. Tests

From the repo root:

```powershell
npm test
```

## Further reading

- `docs/HANDOVER.md` — architecture and module overview
- `docs/ROADMAP.md` — planned work vs current state
