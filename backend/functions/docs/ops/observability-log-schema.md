# Observability Log Schema (Vendor Neutral)

Structured JSON log events keep the platform portable across CloudWatch, Cloud Logging, and self-hosted stacks (Loki/ELK). All fields are ASCII-only and avoid raw IPs or full user-agent strings.

## Required Fields (per event)
- `ts` – ISO8601 timestamp in UTC.
- `level` – `debug` | `info` | `warn` | `error`.
- `message` – short event name (`telemetry`, `request_completed`, etc.).
- `requestId` – unique per request (UUID/v4 acceptable).
- `route` – sanitized path (no query/body payloads).
- `method` – HTTP verb.
- `status` – HTTP status code (if applicable).
- `latencyMs` – end-to-end latency in milliseconds.
- `authState` – `authenticated` | `anonymous`.
- `visitorId` – opaque visitor token when provided.
- `ipHash` – salted SHA-256 hash of client IP (no raw IP retained).
- `uaSummary` – `{browser, os, device, isBot}` bucketed UA summary (no raw UA string).
- `referrerHost` – host component only; defaults to `direct`.
- `utm` – `{source, medium, campaign}` when present.
- `error` – optional structured error message/stack (string or object); omit PII.

## Optional Fields
- `abuseGuard` – `{routeKey, allowed, remaining, blockedUntil}` when rate limiting is evaluated.
- `session` – `{sessionId, isNew}` when telemetry/session writes succeed.
- `tenant`/`service` – multi-service identifier when deployed on shared clusters.

## Sample Event (minimal)
```json
{
  "ts": "2025-01-08T06:21:34.512Z",
  "level": "info",
  "message": "request_completed",
  "requestId": "a1b2c3d4",
  "route": "/v2/recruit/login",
  "method": "POST",
  "status": 401,
  "latencyMs": 128,
  "authState": "anonymous",
  "visitorId": "v-123",
  "ipHash": "3f2f...c9e",
  "uaSummary": {"browser": "Chrome", "os": "macOS", "device": "desktop", "isBot": false},
  "referrerHost": "direct",
  "utm": {"source": "email", "medium": "newsletter", "campaign": "winter"}
}
```

## PII Guardrails
- Never emit raw IPs, raw user-agent strings, or full URLs with query params.
- Hashing salt is provided via `IP_HASH_SALT` and must be kept secret.
- Logs should stay under 10KB per event to remain ingestion-friendly on all vendors.
