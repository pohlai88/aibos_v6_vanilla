# Contributing (Monorepo)

## Daily commands
```bash
pnpm i
pnpm codegen
pnpm lint && pnpm typecheck && pnpm build && pnpm test
pnpm run arch:ts && pnpm run arch:py
```

## Adding a new API
1. Edit `packages/shared/openapi.yaml`.
2. Run `pnpm codegen`, commit generated clients.
3. Use the generated TS client in frontend; keep server in sync.

## Adding a new package
- `apps/` for deployables; `packages/` for libs.
- Keep import boundaries; add CODEOWNERS entry.

## Env
- Copy `.env.example` to app `.env.development` (never commit secrets).
- Validators will fail startup on missing/invalid values.
