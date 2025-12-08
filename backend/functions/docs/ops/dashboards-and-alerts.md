# Dashboards & Alerts (Vendor Neutral)

Operational dashboards must stay portable across AWS CloudWatch, GCP Cloud Logging, and self-hosted Loki/ELK. All alerts assume the standard log schema (see `observability-log-schema.md`).

## Critical Alerts (6)
1. **A1 – 5xx Error Rate**: >1% of requests or >10 errors over 5 minutes.
2. **A2 – Latency p95**: p95 latency > 1500ms over 5 minutes.
3. **A3 – 429 Spike**: >2% of requests or >25 events with status=429 over 5 minutes.
4. **A4 – Login Failures**: >5% 4xx on `/recruit/login` or `/auth/login` over 5 minutes.
5. **A5 – Telemetry Write Failures**: any log line containing `Telemetry write failed` or `Visitor session write failed` in the last 5 minutes.
6. **A6 – Abuse Store Errors**: any log line containing `Redis abuse guard error` or `Firestore` abuse errors in the last 5 minutes.

## Example Queries
Thresholds can be implemented as metric filters or alerting policies on the results below.

### AWS CloudWatch Insights
```sql
fields @timestamp, @message, route, status, latencyMs
| filter ispresent(status)
| stats count(*) as requests,
        count_if(status >= 500) as status_5xx,
        100 * count_if(status >= 500) / max(count(*),1) as pct_5xx,
        pct(latencyMs, 95) as p95_latency,
        count_if(status = 429) as status_429,
        100 * count_if(status = 429) / max(count(*),1) as pct_429,
        count_if(status >= 400 and route like /recruit\/login|auth\/login/) as login_fail,
        100 * count_if(status >= 400 and route like /recruit\/login|auth\/login/) / max(count(*),1) as pct_login_fail,
        count_if(@message like /Telemetry write failed|Visitor session write failed/) as telemetry_errors,
        count_if(@message like /Redis abuse guard error|FirestoreAbuseGuardStore/) as abuse_store_errors
| filter pct_5xx > 1 or p95_latency > 1500 or pct_429 > 2 or pct_login_fail > 5 or telemetry_errors > 0 or abuse_store_errors > 0
```

### GCP Cloud Logging (Logging Query)
```
jsonPayload.status>=0
| stats count(*) as requests,
        countif(jsonPayload.status>=500) as status_5xx,
        100*countif(jsonPayload.status>=500)/max(count(*),1) as pct_5xx,
        percentile(jsonPayload.latencyMs,95) as p95_latency,
        countif(jsonPayload.status=429) as status_429,
        100*countif(jsonPayload.status=429)/max(count(*),1) as pct_429,
        countif(jsonPayload.status>=400 and (jsonPayload.route=~"recruit/login" OR jsonPayload.route=~"auth/login")) as login_fail,
        100*countif(jsonPayload.status>=400 and (jsonPayload.route=~"recruit/login" OR jsonPayload.route=~"auth/login"))/max(count(*),1) as pct_login_fail,
        countif(textPayload: "Telemetry write failed" OR textPayload: "Visitor session write failed") as telemetry_errors,
        countif(textPayload: "Redis abuse guard error" OR textPayload: "FirestoreAbuseGuardStore") as abuse_store_errors
| filter pct_5xx > 1 OR p95_latency > 1500 OR pct_429 > 2 OR pct_login_fail > 5 OR telemetry_errors > 0 OR abuse_store_errors > 0
```

### Self-hosted (Loki / ELK)
- **ELK (Kibana DSL) aggregation example:**
```
{
  "size": 0,
  "query": {"match_all": {}},
  "aggs": {
    "requests": {"value_count": {"field": "requestId"}},
    "status_5xx": {"filter": {"range": {"status": {"gte": 500}}}},
    "status_429": {"filter": {"term": {"status": 429}}},
    "login_fail": {"filter": {"regexp": {"route": "recruit/login|auth.*"}}},
    "p95_latency": {"percentiles": {"field": "latencyMs", "percents": [95]}},
    "telemetry_errors": {"filter": {"query_string": {"query": "message:(\"Telemetry write failed\" OR \"Visitor session write failed\")"}}},
    "abuse_store_errors": {"filter": {"query_string": {"query": "message:(\"Redis abuse guard error\" OR \"FirestoreAbuseGuardStore\")"}}}
  }
}
```
- **Loki/LogQL example (5 minute window):**
```
let total = sum(count_over_time({app="functions"} | json | status >= 0 [5m]))
let err5xx = sum(count_over_time({app="functions"} | json | status >= 500 [5m]))
let rate429 = 100 * sum(count_over_time({app="functions"} | json | status = 429 [5m])) / clamp_min(total,1)
let loginFail = 100 * sum(count_over_time({app="functions"} | json | status >= 400 and route =~ "recruit/login|auth/login" [5m])) / clamp_min(total,1)
let telemetryErr = sum(count_over_time({app="functions"} |= "Telemetry write failed" [5m]))
let abuseErr = sum(count_over_time({app="functions"} |= "Redis abuse guard error" or {app="functions"} |= "FirestoreAbuseGuardStore" [5m]))
err5xx > total * 0.01 or quantile_over_time(0.95, {app="functions"} | json | unwrap latencyMs [5m]) > 1500 or rate429 > 2 or loginFail > 5 or telemetryErr > 0 or abuseErr > 0
```

## Dashboard Minimums
- Traffic: requests_total, status_5xx, status_4xx, status_429, latency_p95.
- Reliability: Telemetry write errors (count), abuse store errors (count), job success for retention cleanup.
- Security/Abuse: login_fail rate, abuse guard hit rate, block durations.

## Alert Routing
- Page on A1/A2/A6; ticket on A3/A4; warning on A5 (investigate but API still serves due to degrade mode).
- All alerts should include environment, route sample, and recent requestIds to aid triage.
