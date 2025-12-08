# Monitoring Strategy: What to Use When

Use the right tool for the job while keeping vendor choices open (AWS/GCP/Open Source).

- **Real-time / Debugging:** Use **logs** (CloudWatch / Loki / ELK / GCP Logging).
  - Best for: "Why did this specific request fail?" or "Is the site down right now?"
  - Filter by `requestId`, `route`, `status`, `securityEvent`, `rateLimited`, never raw IP (use `ipHash`/`visitorId`).
- **Trends / Business:** Use **Admin Ops API (Firestore aggregates)**.
  - Best for: "How many visitors yesterday?", "Device distribution", "Weekly retention".
  - Validate anomalies seen in logs by comparing to aggregates to confirm customer impact.

Keep both paths documented: logs for immediacy, Admin Ops API for trustworthy longitudinal metrics.
