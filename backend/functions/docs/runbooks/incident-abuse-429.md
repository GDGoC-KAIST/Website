# Incident Runbook: Abuse Spike (429)

**Trigger:** Alert "Abuse Spike (429)" (>50 blocked over 5m).

## Investigation
- Run "Abuse Block (429)" query from `docs/ops/monitoring/queries.md`.
- Pivot on `ipHash` or `visitorId` to spot bursty sources; review `route` patterns.
- Check abuse guard/ratelimiter logs for misconfiguration.

## Actions
- If clear bot/source, block at firewall or edge (by IP range/fingerprint where allowed).
- If false positives, relax thresholds in `ABUSE_POLICIES` or whitelist specific actors.
- Communicate to stakeholders; monitor counts after change.
- Document findings and update guardrails to prevent regression.
