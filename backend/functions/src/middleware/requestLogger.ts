import type {Request, Response, NextFunction} from "express";
import {randomUUID} from "crypto";
import {logger} from "../utils/logger";
import {redact, REDACT_KEYS} from "../utils/redact";

function cloneSafely<T>(value: T): T | undefined {
  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value)) as T;
    } catch {
      return undefined;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = randomUUID();
  (req as Request & {id?: string}).id = requestId;
  res.setHeader("x-request-id", requestId);

  const safeBody = redact(cloneSafely(req.body) ?? {});
  const safeQuery = redact(cloneSafely(req.query) ?? {});
  const safeHeaders = redact(cloneSafely(req.headers) ?? {});

  res.on("finish", () => {
    const latency = Date.now() - start;
    const userId = req.user?.sub;
    const {telemetry} = req;
    const securityEvent = (req as Request & {securityEvent?: string}).securityEvent;
    const rateLimited = (req as Request & {rateLimited?: boolean}).rateLimited;
    if (telemetry) {
      telemetry.status = res.statusCode;
      telemetry.path = telemetry.path || req.path;
      telemetry.method = telemetry.method || req.method;
    }
    const safeUrl = (() => {
      try {
        const parsed = new URL(req.originalUrl, "http://local");
        for (const [key] of parsed.searchParams.entries()) {
          if (REDACT_KEYS.has(key.toLowerCase())) {
            parsed.searchParams.set(key, "*****");
          }
        }
        const qs = parsed.searchParams.toString();
        const hash = parsed.hash ?? "";
        return `${parsed.pathname}${qs ? `?${qs}` : ""}${hash}`;
      } catch {
        return req.originalUrl;
      }
    })();
    const meta = {
      schemaVersion: "obs.v1",
      ts: new Date().toISOString(),
      requestId,
      route: safeUrl,
      method: req.method,
      status: res.statusCode,
      latencyMs: latency,
      authState: req.user ? "authenticated" : "anonymous",
      securityEvent: telemetry?.securityEvent || securityEvent || null,
      rateLimited: Boolean(telemetry?.rateLimited || rateLimited || res.statusCode === 429),
      userId,
      visitorId: telemetry?.visitorId,
      ipHash: telemetry?.ipHash,
      uaSummary: telemetry?.uaSummary,
      request: {
        body: safeBody,
        query: safeQuery,
        headers: safeHeaders,
      },
    };
    if (latency > 800) {
      logger.warn("SLOW_REQUEST_DETECTED", meta);
    } else {
      logger.info("request_completed", meta);
    }
  });

  next();
}
