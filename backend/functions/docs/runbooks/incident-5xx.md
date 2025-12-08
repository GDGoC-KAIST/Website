# Incident Runbook: Elevated 5xx Rate

**Trigger:** Alert "High 5xx Rate" (>1% 5xx over 5m).

## Investigation
- Run "Error Rates (5xx)" query from `docs/ops/monitoring/queries.md`.
- Identify top `route` and recent deploys/releases.
- Check dependency health (DB/Redis/third-party) and error logs for stack traces.

## Actions
- If correlated with a recent deploy, rollback or disable the change.
- If dependency outage, fail over or reduce traffic; coordinate with vendor.
- Raise incident channel; capture request samples by `requestId` (no raw IP/UA).
- Once stabilized, create postmortem tasks and tune alerts if needed.
