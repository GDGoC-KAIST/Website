# Incident Runbook: High Latency

**Trigger:** Alert "High Latency" (p95 > 1000ms over 5m).

## Investigation
- Use latency p95 query from `docs/ops/monitoring/queries.md`; sort by `route`.
- Filter logs where `latencyMs > 1000` and check `requestId` samples.
- Correlate with deployment timeline, database metrics, and cold starts.

## Actions
- Hotfix or rollback offending routes/functions.
- Add caching or raise concurrency if saturated; verify rate limiting not masking abuse.
- If backend dependency slow, route traffic to healthy region or scale dependency.
- After recovery, add regression test/benchmark and update SLO dashboards.
