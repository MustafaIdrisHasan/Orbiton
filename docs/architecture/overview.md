# Orbiton Architecture Overview

## Runtime layout

- `orbiton.ahmedhakeem.in`: frontend and reverse-proxied backend entrypoint
- `/api`: forwarded to the Express API service
- PostgreSQL: primary transactional storage
- MongoDB: secondary derived and analytics storage
- ML service: Python HTTP service for future resume scoring and recommendation pipelines

## Backend principles

- CommonJS modules with clear route, service, and repository boundaries
- OpenAPI is the contract source of truth
- JWT access + refresh token design
- RBAC enforced close to route groups
- storage, mail, and intelligence integrations hidden behind adapters

