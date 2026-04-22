# Orbiton Fullstack Architecture Plan

## Summary
Build Orbiton as a frontend-first monorepo with a React + Vite client, a modular Node.js/Express REST API, design-first OpenAPI contracts, PostgreSQL as the transactional system of record, and MongoDB reserved for derived documents, analytics, and future intelligence outputs.

For deployment under `ahmedhakeem.in`, use a split public surface:
- `orbiton.ahmedhakeem.in` for the frontend
- backend exposed behind `/api` on the same public app domain, or as an internal service behind the reverse proxy
- keep room to promote the API to `api-orbiton.ahmedhakeem.in` later without changing internal module boundaries

Phase 1 should ship the core CRUD and workflow portals for Student, Recruiter, TPO/Admin, and Faculty. Future AI, MFA, deep analytics, and backup/restore stay explicitly scaffolded but not implemented.

## Proposed Structure
```text
orbiton-full/
  apps/
    web/                      # React + Vite frontend
    api/                      # Express backend (CommonJS)
    ml-service/               # Python service for intelligence layer
  packages/
    openapi/                  # OpenAPI source, generated schemas/clients
    ui/                       # shared frontend components/tokens
    config/                   # eslint, prettier, ts/js config, env helpers
    test-utils/               # shared testing/reporting helpers
  infrastructure/
    docker/
    nginx/
    db/
      postgres/
      mongo/
    scripts/
  docs/
    architecture/
    api/
    reporting/
```

Backend module layout inside `apps/api`:
```text
src/
  app.js
  server.js
  config/
  core/
    errors/
    middleware/
    constants/
    utils/
  modules/
    auth/
    users/
    roles/
    students/
    faculty/
    recruiters/
    drives/
    applications/
    rounds/
    offers/
    placements/
    resumes/
    skills/
    certifications/
    marks/
    notifications/
    audit/
    reports/
    search/
  integrations/
    postgres/
    mongo/
    storage/
    mail/
    intelligence/
  docs/
  tests/
```

Frontend route/domain layout inside `apps/web`:
```text
src/
  app/
    router/
    providers/
    layouts/
  features/
    auth/
    dashboard/
    profile/
    notifications/
    student/
    recruiter/
    faculty/
    admin/
    tpo/
    drives/
    applications/
    rounds/
    offers/
    resumes/
    settings/
  shared/
    api/
    ui/
    hooks/
    utils/
    types/
  pages/
```

## Key Changes And Interfaces
Public-facing backend/API shape:
- Version all APIs under `/api/v1`
- Keep OpenAPI as the source of truth; controllers and request/response validators must map to spec-first contracts
- Use JWT auth with short-lived access token and refresh-token flow
- Use RBAC middleware around route groups with role constants: `STUDENT`, `FACULTY`, `ADMIN`, `RECRUITER`
- Use service/repository boundaries per module so each domain owns its routes, validation, service logic, and data access

Core domain ownership:
- `auth`: login, refresh, forgot/reset password, change password, session invalidation
- `users` + `roles`: admin-created users, activation/deactivation, role assignment
- `students` / `recruiters` / `faculty`: role-specific profile management
- `drives`: drive CRUD, eligibility rules, required skills, featured drives
- `applications`: apply, withdraw, status timeline, recruiter shortlist/reject
- `rounds`: drive round CRUD, scheduling, result entry, student round visibility
- `offers` + `placements`: issue offers, accept/reject, confirm placement records
- `resumes`: upload/list/delete/set active, storage abstraction for object storage
- `notifications`: global user notifications and mark-as-read
- `audit` + `reports`: structured reporting and auditability for administrative review

Database plan:
- PostgreSQL remains the source of truth for all transactional modules based on the pilot schema
- Evolve the pilot schema rather than redesigning it; normalize around explicit enums/status tables only where needed during implementation
- MongoDB stores derived/secondary data only: search documents, analytics snapshots, resume analysis output, recommendation artifacts, rich activity/event documents
- Resume file binaries do not live in the database; store metadata in PostgreSQL and files through an object-storage adapter

Frontend plan:
- Build the core shell first: auth pages, route guards, role-aware layout, dashboard redirect, profile, notifications, 404/unauthorized/server-error pages
- Then deliver the main CRUD feature slices:
  - Student: profile, academic details, skills, certifications, marks, resumes, drives, applications, rounds, offers
  - Recruiter: company profile, drives, applicants, shortlist/reject, rounds, offers
  - TPO/Admin: dashboards, student management, drive oversight, application/round monitoring, offers/placements, user/role management
  - Faculty: assigned-student monitoring and academic overview
- Keep “future” features visible only as placeholders or hidden routes, not partially implemented production flows

## Test Plan
Testing must be reportable and structured by layer:
- Unit tests for services, validators, RBAC rules, eligibility logic, and utility functions
- Integration tests for API modules against PostgreSQL and mocked external services
- Contract tests to verify implementation matches OpenAPI request/response shapes
- End-to-end frontend tests for key journeys:
  - admin creates user and assigns role
  - user login and role-based dashboard redirect
  - student updates profile and uploads/activates resume
  - recruiter creates drive and adds rounds
  - student applies to drive and sees round status
  - recruiter records round result and issues offer
  - student accepts/rejects offer
  - TPO/Admin reviews placements and exports report
- Reporting outputs:
  - machine-readable test results for CI
  - HTML/JUnit coverage and execution summaries for stakeholder reporting

## Assumptions And Defaults
- React + Vite is the frontend foundation
- Phase 1 is limited to core portals and CRUD/workflow completeness, not the full future sitemap
- Users are admin-created in v1 for all roles unless later policy changes are requested
- The pasted pilot PostgreSQL schema is the base model to extend and harden
- MongoDB is secondary in v1 and does not own any primary transactional workflow
- MFA, AI scoring/recommendations, advanced analytics, API usage monitoring, and backup/restore are deferred but planned as extension points
- Recommended initial delivery order:
  1. monorepo scaffold + OpenAPI foundation
  2. auth/RBAC + shared frontend shell
  3. student core flows
  4. recruiter drive/applicant/round flows
  5. TPO/Admin oversight and reports
  6. faculty views
  7. ML/Mongo-derived features
