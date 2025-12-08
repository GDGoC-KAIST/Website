# Vendor-Neutral Log Queries (Schema: obs.v1)

This document provides copy-paste query templates for AWS CloudWatch Logs Insights, Grafana Loki, ELK Stack, and GCP Cloud Logging. Fields assume `schemaVersion: "obs.v1"` and the request log contains `ts`, `requestId`, `route`, `method`, `status`, `latencyMs`, `authState`, `securityEvent`, `rateLimited`, plus `visitorId`/`ipHash`/`uaSummary` from telemetry.

> Privacy note: always pivot on `ipHash` or `visitorId`, never raw IP/UA strings.

## 1. Error Rates (5xx)
- **Goal:** Count server errors per 5 minutes.
- **AWS CloudWatch:**
  - `filter status >= 500 | stats count(*) as errors by bin(5m)`
- **Loki (LogQL):**
  - `sum(count_over_time({app="backend"} | json | status >= 500 [5m]))`
- **ELK (KQL):**
  - `status >= 500` *(Visualize with Date Histogram, 5m interval)*
- **GCP Logging:**
  - `jsonPayload.status >= 500`
  - Chart with 5m alignment.

## 2. Latency p95
- **Goal:** Find p95 latency by route (5m window).
- **AWS:**
  - `stats pct(latencyMs, 95) as p95 by route`
- **Loki:**
  - `quantile_over_time(0.95, {app="backend"} | json | unwrap latencyMs [5m])`
- **ELK:**
  - Use Lens/TSVB: `latencyMs` field → Percentile (95th) split by `route`.
- **GCP:**
  - `jsonPayload.latencyMs:*` then use Distribution metric view; group by `jsonPayload.route`.

## 3. Abuse Block (429)
- **Goal:** Identify blocked traffic sources (rate limiting / abuse guard).
- **AWS:**
  - `filter status = 429 | stats count(*) as blocked by ipHash`
- **Loki:**
  - `sum by (ipHash) (count_over_time({app="backend"} | json | status == 429 [5m]))`
- **ELK:**
  - `status:429` then Terms agg on `ipHash` (or `visitorId`).
- **GCP:**
  - `jsonPayload.status = 429` then group by `jsonPayload.ipHash`.

## 4. Recruit Login Failures
- **Goal:** Detect credential stuffing on recruit login.
- **Signal:** `securityEvent="recruit_login_fail"`.
- **AWS:**
  - `filter securityEvent = "recruit_login_fail" | stats count(*) by bin(1m)`
- **Loki:**
  - `sum(count_over_time({app="backend"} | json | securityEvent="recruit_login_fail" [1m]))`
- **ELK:**
  - `securityEvent:"recruit_login_fail"` then Date Histogram (1m).
- **GCP:**
  - `jsonPayload.securityEvent="recruit_login_fail"`.

## 5. Trace by Request ID
- **Goal:** Debug a specific request end-to-end.
- **AWS:**
  - `filter requestId = "REQ_ID"`
- **Loki:**
  - `{app="backend"} | json | requestId = "REQ_ID"`
- **ELK:**
  - `requestId:"REQ_ID"`
- **GCP:**
  - `jsonPayload.requestId = "REQ_ID"`
