import type {Request, Response, NextFunction} from "express";
import {randomUUID} from "crypto";
import {logger} from "../utils/logger";
import {redact} from "../utils/redact";

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
    const telemetry = req.telemetry;
    const meta = {
      requestId,
      userId,
      ...(telemetry ? {telemetry} : {}),
      httpRequest: {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        latencyMs: latency,
      },
      request: {
        body: safeBody,
        query: safeQuery,
        headers: safeHeaders,
      },
    };
    if (latency > 800) {
      logger.warn("SLOW_REQUEST_DETECTED", meta);
    } else {
      logger.request(meta);
    }
  });

  next();
}
