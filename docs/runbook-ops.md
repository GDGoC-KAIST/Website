# GDGoC KAIST Backend – Ops Runbook

## 1. Emergency Triggers (Kill Switches)

| Switch | Env Var | Effect |
| --- | --- | --- |
| Disable Email Sending | `DISABLE_EMAIL_SENDING=true` | `sendEmail` logs `KILL_SWITCH_TRIGGERED` and skips SES |
| Disable GitHub Login | `DISABLE_GITHUB_LOGIN=true` | `/v2/auth/login/github` returns `503 SERVICE_DISABLED` |

### How to Apply
1. Update the environment (Firebase Functions config or CI secrets):
   ```bash
   firebase functions:config:set runtime.DISABLE_EMAIL_SENDING=true
   firebase functions:config:set runtime.DISABLE_GITHUB_LOGIN=true
   ```
2. Redeploy or restart the function.
3. Verify via health check:
   ```bash
   curl https://<project>.web.app/healthz
   ```
   Ensure `killSwitches.email` or `killSwitches.githubLogin` shows `true`.

### Verification Checklist
- Confirm incident symptoms stop (e.g., no outbound SES traffic).
- Revert switch to `false` when safe and redeploy.

## 2. Data Repair (Admin Migrations)

### General Pattern
Always perform a dry run first:
```bash
curl -X POST "https://<project>.web.app/v2/admin/migrations/run?name=backfillCounters&dryRun=true&limit=50" \
  -H "Authorization: Bearer <admin-token>"
```
Review the `report.updated` count. If expected, re-run without `dryRun`:
```bash
curl -X POST "https://<project>.web.app/v2/admin/migrations/run?name=backfillCounters&dryRun=false&limit=50" \
  -H "Authorization: Bearer <admin-token>"
```

### Available Migrations
- `timestampNormalize`: fixes numeric timestamps on seminars (`date`, `createdAt`).
- `backfillCounters`: ensures `likeCount`, `commentCount` exist for projects/seminars.
- `backfillImageOwner`: fills missing `uploaderUserId` with `SYSTEM`.

### Monitoring
- After a migration, sample affected documents to confirm values.
- Check logs for `report` output and any `ERROR` severity entries.
