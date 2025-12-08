import {Rate, Counter, Trend} from "k6/metrics";

export const ErrorRate = new Rate("errors");
export const RateLimitedRate = new Rate("rate_limited_429");
export const RecruitLoginFailCounter = new Counter("recruit_login_fail");
export const LatencyTrend = new Trend("latency_ms");
