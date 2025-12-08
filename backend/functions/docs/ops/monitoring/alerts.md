# Critical Alerts (obs.v1)

Vendor-neutral alert intents. Align log-based detectors to `schemaVersion: "obs.v1"` fields; avoid raw IP/UA usage.

1. **High 5xx Rate** — more than 1% of requests are 5xx over 5m.
   - *Signal:* error-rate = errors/requests > 0.01.
   - *Response:* Page on-call; start `incident-5xx` runbook.
2. **High Latency** — p95 latency > 1000ms over 5m.
   - *Signal:* p95(`latencyMs`) by route.
   - *Response:* Page; follow `incident-latency` runbook.
3. **Abuse Spike (429)** — more than 50 blocked requests over 5m.
   - *Signal:* status==429 OR rateLimited=true.
   - *Response:* Page; follow `incident-abuse-429` runbook.
4. **Recruit Login Fails** — more than 10 failures over 5m.
   - *Signal:* `securityEvent="recruit_login_fail"`.
   - *Response:* Page security on-call.
5. **Auth Login Fails** — more than 20 failures over 5m.
   - *Signal:* `securityEvent="auth_login_fail"`.
   - *Response:* Ticket severity P2 unless correlated with spike; page if sustained.
6. **Traffic Spike** — requests exceed 3x trailing 7-day median for same window.
   - *Signal:* total requests.
   - *Response:* Notify; verify promo/attack; scale if needed.
7. **Admin Access Denied** — any 403 on `/v2/admin` routes.
   - *Signal:* `route startswith /v2/admin` AND status==403.
   - *Response:* Page security; review access patterns.
8. **Telemetry Write Fail** — any log with `telemetryWrite="failed"`.
   - *Signal:* telemetry middleware warnings.
   - *Response:* Ticket; investigate datastore availability.
