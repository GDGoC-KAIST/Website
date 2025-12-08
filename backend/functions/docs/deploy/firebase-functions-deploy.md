# Firebase Functions Deploy Runbook

## Prerequisites
- Node.js 20.x locally
- Firebase CLI logged in (`firebase login`) and targeting the correct project alias
- Secrets populated via Firebase Secrets Manager or runtime config (mirrors `.env.example`)
- Build artifacts generated with `npm run build` (CI should do this before deploy)

## Deploy
1) Install dependencies: `npm ci`
2) (Optional) Run quality gates: `npm run gate`
3) Deploy functions: `firebase deploy --only functions`
4) Post-deploy smoke test (from `backend/functions`): `./scripts/smoke-test.sh https://<region>-<project>.cloudfunctions.net`

## Rollback
- Use Firebase Console → Functions → Select function → Version History → Rollback to previous version.

## Notes
- Use project aliases for staging vs production (`firebase use <alias>`).
- Ensure secrets (`JWT_SECRET`, `IP_HASH_SALT`, Redis config) are set in the project before deploying.
- `TRUST_PROXY_HOPS` should match your ingress/proxy count when running behind Firebase Hosting or an external gateway.
