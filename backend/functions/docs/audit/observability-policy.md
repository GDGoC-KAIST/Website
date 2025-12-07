# Observability Policy (Telemetry & Privacy)

## Retention
- Raw logs: 14 days
- Aggregated statistics: 90 days

## Access Control
- Accessible only to Admin/DevOps roles
- Access via secured logging backend with audit trail

## Logged Fields
- `requestId`, `ipHash`, `uaSummary` (browser/os/isBot), `latencyMs`, `status`, `path`, `method`
- Optional: outcome markers for sensitive flows (e.g., recruit login/apply) without PII

## PII & Privacy Rules
- Raw IP addresses and raw User-Agent strings are **never** stored
- Sensitive values (email, phone, tokens, passwords) are masked before logging
- ipHash computed as `sha256(SALT + IP)`; UA stored only as summarized family + bot flag

## Security Notes
- Ensure `IP_HASH_SALT` is configured per environment
- Trust proxy is enabled so `req.ip` respects forwarded client IPs
- Telemetry middleware executes before request logging
