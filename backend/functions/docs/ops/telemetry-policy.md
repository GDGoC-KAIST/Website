# Telemetry & Visitor Analytics Policy

## Purpose
Collect minimal, privacy-preserving operational signals to monitor traffic, reliability, and abuse without retaining personal data.

## Privacy Principles
- No raw IPs or user-agent strings are stored; only salted `ipHash` and coarse `uaSummary` buckets are retained.
- No full URLs or query payloads are stored; only path, method, and sanitized telemetry are logged.
- UTM capture is limited to `source`, `medium`, and `campaign`.

## Data Architecture
- Pointer-based sessions: `visitorPointers/{visitorId}` points to the active session in `visitorSessions`, enabling O(1) lookups with a 30-minute inactivity timeout.
- Write throttling: updates are skipped if the last write is within 7 seconds to control Firestore write volume.
- Aggregations: `opsDailyAgg/{date}` and `opsHourlyAgg/{date}/hours/{HH}` maintain request/session counters and coarse buckets for browser, OS, and referrer.

## Retention
- Analytics data is intended for short-lived operational use; rotate/expire data after 90 days via scheduled cleanup (planned ops task).

## Safety Controls
- Key sanitization replaces dots in bucket keys to prevent Firestore path issues; map growth is kept bounded by favoring coarse buckets (top-level family counts, referrer host).
- Structural logs include telemetry hashes/summaries only, suitable for Cloud Logging analysis without exposing personal data.
