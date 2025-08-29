# AIBOS Monorepo Architecture

## Principles
- One source of truth per concern (compose, tsconfig, contracts, env)
- Contracts as code (OpenAPI) with generated clients
- Runtime env validation (Zod / Pydantic)
- Enforced boundaries (dep-cruiser, import-linter)

## Structure
- `apps/` = deployables
- `packages/` = reusable libs
- `infra/` = IaC (docker/k8s)
- `tools/` = DX scripts

## Rules
1. Frontend cannot import from `packages/backend/**`.
2. All API types come from `packages/shared/clients/**`.
3. No inline version constants in code.
4. CI must pass arch tests + codegen freshness.

## Migration (high level)
1. Freeze old folders; create new skeleton.
2. Move frontend app → `apps/frontend`; libs → `packages/frontend`.
3. Move Python services → `apps/api-python`; domain libs → `packages/backend`.
4. Define API in `packages/shared/openapi.yaml`; generate clients.
5. Add env validators; wire compose; enable CI.
