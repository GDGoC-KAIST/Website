# Environment Specification

## Required variables
- `NODE_ENV`: `production`
- `PORT`: listener port (default `8080`)
- `JWT_SECRET`: signing secret for access tokens
- `IP_HASH_SALT`: salt for telemetry hashing
- `TRUST_PROXY_HOPS`: number of proxy hops to trust (use `1` behind a single ingress)
- `ABUSE_GUARD_STORE`: `firestore` (default) or `redis`

## Optional / vendor-specific
- `REDIS_URL` **or** `REDIS_HOST` + `REDIS_PORT` + `REDIS_PASSWORD` (required when `ABUSE_GUARD_STORE=redis`)
- `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` (for Firebase hosting/runtime)
- Any SMTP/email credentials if mail sending is enabled in your deployment

## Staging vs Production
- Staging may reuse non-sensitive defaults but must use distinct secrets (`JWT_SECRET`, `IP_HASH_SALT`).
- Production must use unique, high-entropy secrets and locked-down Redis/Storage endpoints.
- Keep `.env` files out of VCS; inject via your orchestrator (CI/CD, runtime secret store).

## Secret management (vendor-neutral)
- **Cloud secret stores**: GCP Secret Manager, AWS Secrets Manager/SSM Parameter Store, Azure Key Vault.
- **CI/CD injection**: configure pipeline-level secrets and render `.env` at deploy time.
- **Local testing**: copy `.env.example` to `.env` and fill values; never commit real secrets.
