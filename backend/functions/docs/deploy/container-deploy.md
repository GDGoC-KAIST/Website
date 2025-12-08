# Container Deploy Runbook (Vendor-Neutral)

## Prerequisites
- Docker CLI and access to your registry (e.g., GCR, ECR, ACR, Docker Hub)
- `.env` file based on `.env.example` with production secrets
- Optional: ingress/proxy configured to forward to container port 8080

## Build & Push
1) Build: `docker build -t <registry>/<repo>/backend-functions:<tag> .`
2) Push: `docker push <registry>/<repo>/backend-functions:<tag>`

## Run (local or staging)
- `docker run -p 8080:8080 --env-file .env <registry>/<repo>/backend-functions:<tag>`
- Set `TRUST_PROXY_HOPS` if behind a reverse proxy/load balancer.

## Smoke test
- From `backend/functions`: `./scripts/smoke-test.sh http://<host>:8080`
- Pipeline should fail if health checks fail.

## Rollback
- Re-deploy the previous known-good image tag to your orchestrator (Kubernetes, ECS, Cloud Run, etc.).

## Notes
- When `ABUSE_GUARD_STORE=redis`, ensure the container can reach Redis and credentials are supplied.
- Storage access uses the default Firebase bucket; supply `FIREBASE_PROJECT_ID`/`FIREBASE_STORAGE_BUCKET` if required by your platform.
