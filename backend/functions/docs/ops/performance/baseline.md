# Performance Baseline (k6)

Record Go/No-Go metrics for each scenario. Threshold guidance: p95 < 1000ms; 5xx error rate < 0.1%.

| Scenario | p95 Latency (ms) | Error Rate (5xx) | 429 Rate | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- |
| Browse | | | | | |
| Authenticated | | | | | |
| Recruit Attack | | | | | |
| Soak (30m) | | | | | |

## How to Use
- Run scenarios with `npm run perf:*` (set `BASE_URL`, tokens as needed).
- Populate the table above after each run.
- Treat runs as failed if thresholds are exceeded; capture request IDs for debugging.
