# Ops Dashboard Metrics (Multi-Vendor)

## Standard Log Schema
- `ts`: ISO8601 timestamp
- `requestId`: unique per request
- `route`: sanitized path + query (PII scrubbed)
- `method`: HTTP verb
- `status`: HTTP status code
- `latencyMs`: end-to-end latency in milliseconds
- `authState`: `authenticated` | `anonymous`
- `visitorId`: anonymized visitor token (if provided)
- `ipHash`: salted hash of client IP (no raw IP stored)
- `uaSummary`: parsed user agent summary (browser, os, device, isBot)

## Core Metrics
1. `requests_total` – count of all requests
2. `status_5xx` – server errors
3. `status_4xx` – client errors
4. `latency_p95` – 95th percentile latency
5. `abuse_429` – rate-limited requests
6. `login_fail` – failed auth attempts (4xx on login routes)

## Appendix A – AWS (CloudWatch Insights)
```sql
fields @timestamp, @message
| filter status >= 400
| stats count(*) as requests_total,
        count_if(status >= 500) as status_5xx,
        count_if(status >= 400 and status < 500) as status_4xx,
        pct(latencyMs, 95) as latency_p95,
        count_if(status = 429) as abuse_429,
        count_if(status >= 400 and route like /recruit\/login|auth\/login/) as login_fail
```

## Appendix B – GCP (Logging Query)
```
jsonPayload.request_completed
jsonPayload.status>=0
| stats count(*) as requests_total,
        countif(jsonPayload.status>=500) as status_5xx,
        countif(jsonPayload.status>=400 and jsonPayload.status<500) as status_4xx,
        percentile(jsonPayload.latencyMs,95) as latency_p95,
        countif(jsonPayload.status=429) as abuse_429,
        countif(jsonPayload.status>=400 and (jsonPayload.route=~"recruit/login" OR jsonPayload.route=~"auth")) as login_fail
```

## Appendix C – Self-hosted (ELK/Loki)
- **ES/ELK (Kibana DSL):**
```
{
  "size": 0,
  "query": {"match_all": {}},
  "aggs": {
    "requests_total": {"value_count": {"field": "requestId"}},
    "status_5xx": {"filter": {"range": {"status": {"gte": 500}}}},
    "status_4xx": {"filter": {"range": {"status": {"gte": 400, "lt": 500}}}},
    "latency_p95": {"percentiles": {"field": "latencyMs", "percents": [95]}},
    "abuse_429": {"filter": {"term": {"status": 429}}},
    "login_fail": {"filter": {"regexp": {"route": "recruit/login|auth.*"}}}
  }
}
```
- **Loki/LogQL:**
```
sum by (route) (count_over_time({app="functions"} | json | status >= 0 [5m]))
sum(count_over_time({app="functions"} | json | status=429 [5m]))
quantile_over_time(0.95, {app="functions"} | json | latencyMs>0 | unwrap latencyMs [5m])
```
