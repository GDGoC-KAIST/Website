import http from "k6/http";
import {config} from "./env.js";
import {ErrorRate, RateLimitedRate, LatencyTrend} from "./metrics.js";

const defaultVisitorId = () => `vu-${__VU || 0}`;

function buildHeaders(token, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Visitor-Id": defaultVisitorId(),
    ...extraHeaders,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function track(res, expect429 = false) {
  LatencyTrend.add(res.timings.duration);
  if (res.status === 429) {
    RateLimitedRate.add(1);
    if (!expect429) {
      ErrorRate.add(1);
    }
  } else if (res.status >= 400) {
    ErrorRate.add(1);
  }
}

export function get(path, opts = {}) {
  const res = http.get(`${config.baseUrl}${path}`, {
    headers: buildHeaders(opts.token, opts.headers),
  });
  track(res, opts.expect429 === true);
  return res;
}

export function post(path, payload, opts = {}) {
  const res = http.post(
    `${config.baseUrl}${path}`,
    payload ? JSON.stringify(payload) : null,
    {
      headers: buildHeaders(opts.token, opts.headers),
    }
  );
  track(res, opts.expect429 === true);
  return res;
}

export function patch(path, payload, opts = {}) {
  const res = http.patch(
    `${config.baseUrl}${path}`,
    payload ? JSON.stringify(payload) : null,
    {
      headers: buildHeaders(opts.token, opts.headers),
    }
  );
  track(res, opts.expect429 === true);
  return res;
}
