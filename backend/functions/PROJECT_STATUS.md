# Backend Status & Next Steps (as of 2025-12-08)

## Current State
- **Branch**: feature/front-back-test
- **Build/Test**: unit/integration suites passing locally (latest run); `openapi:check` still failing pending rerun after recent fixes. TypeScript is set to `noEmit` in root tsconfig; scripts/tsconfig.scripts.json still allows emitting/ts-node where needed.
- **Key Changes in Progress**:
  - OpenAPI SSOT: generator (`scripts/print-openapi.ts`) emits scoped specs (public/admin/ops) via direct file write; coverage checker (`verify-openapi-coverage.mts`) enforces docs against router; swagger UI serves inline multi-spec at `/v2/docs` plus raw JSON endpoints.
  - CORS hardened: allowlist with localhost opt-in in dev; integration tests updated; env-driven.
  - Lint/config: `allowImportingTsExtensions` enabled with `noEmit`; local module declarations added for `swagger-ui-express`.

## Outstanding Items
- **openapi:check**: recently failing (exit 1). Rerun after npm install to confirm; if failing, inspect `docs/openapi.ops.json` vs router extraction.
- **tsconfig noEmit**: Build command `npm run build` may need a separate tsconfig (without `noEmit`) if emit is required; currently tests run against ts-node.
- **Redis-free test env**: Integration tests pin `ABUSE_GUARD_STORE=firestore`; ensure env defaults stay aligned.

## Next Steps (ordered)
1. Run `npm install` (new devDep @types/swagger-ui-express) and `npm run openapi:check`; fix any missing routes/spec drift if still failing.
2. If emit is needed for deploy, add a `tsconfig.build.json` without `noEmit` and point `npm run build` to it; keep `tsconfig.json` with `noEmit` for tooling.
3. Re-verify swagger UI in dev: `/v2/docs` should render inline UI with multi-spec URLs; raw JSON at `/v2/openapi.{public,admin,ops}.json`.
4. Gate run: `npm run gate` to ensure CI parity once openapi:check is green.

## API Surface (v2 highlights)
- **Docs**: `/v2/docs` (inline Swagger UI), `/v2/openapi.{public,admin,ops}.json`.
- **Health**: `/healthz`, `/v2/healthz`.
- **Auth**: `/v2/auth/*` (login, refresh, logout, etc.).
- **Posts**: CRUD at `/v2/posts`, ETag stable read path, view count increment with caching headers.
- **Recruit**: `/v2/recruit/*` (apply/login/profile); admin recruit under `/v2/admin/recruit/*`.
- **Admin/ops**: `/v2/admin/ops/*`, migrations, members, etc. (ops/admin specs split in OpenAPI).

## Testing
- **Integration**: `npm run test` (uses firebase emulators). CORS tests seed required env (`IP_HASH_SALT`, `ABUSE_GUARD_STORE=firestore`). Docs tests expect inline Swagger UI content (SwaggerUIBundle, BaseLayout) with 200 OK.
- **Gate**: `npm run gate` (lint, typecheck, tests, openapi:check/verify, ssot:gate, audit:verify).

## CI/CD & Tooling
- **OpenAPI**: generation via `openapi:generate:{public,admin,ops}`; coverage via `openapi:check`; sync check via `openapi:verify` (compares to baseline).
- **Lint/Typecheck**: ESLint with tsconfig.eslint includes perf scripts; TypeScript `noEmit` in main tsconfig.
- **Emulators**: Firebase emulators orchestrated in integration runs via scripts/pick-ports + with-temp-env.

## Improvement Ideas
- Reduce ignore lists in coverage checker; align ops spec to remove ignores.
- Add build-specific tsconfig to permit emitting JS while keeping editor config strict.
- Optional: replace local `swagger-ui-express` module declaration with published @types if compatible after verification.
- Stabilize post ETag across viewCount increments without extra transaction (already uses hash of id+updatedAt; confirm repo.update preserves updatedAt semantics if viewCount increments).