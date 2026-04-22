# API Contract Notes

- All REST endpoints are versioned under `/api/v1`.
- OpenAPI definitions live in `packages/openapi/openapi.yaml`.
- Controllers should stay thin and map directly to service methods.
- Request validation should be generated or derived from the OpenAPI schema.
- Frontend API clients should be generated from the contract once the schema stabilizes.

