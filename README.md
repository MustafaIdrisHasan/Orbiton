# Orbiton

Orbiton is a placement management system scaffolded as a frontend-first monorepo with a modular Express API, OpenAPI-first contracts, PostgreSQL as the transactional source of truth, MongoDB for derived intelligence data, and a Python intelligence service.

## Workspaces

- `apps/web`: React + Vite frontend shell
- `apps/api`: CommonJS Express API scaffold
- `apps/ml-service`: Python intelligence service scaffold
- `packages/openapi`: OpenAPI source of truth
- `packages/ui`: shared design tokens and primitives
- `packages/config`: shared lint and environment config placeholders
- `packages/test-utils`: test reporting helpers

## First-run checklist

1. Install workspace dependencies with `npm install`.
2. Copy env templates and fill secrets for API and frontend.
3. Start PostgreSQL and MongoDB using the Docker Compose file in `infrastructure/docker`.
4. Run `npm run dev:api` and `npm run dev:web`.

