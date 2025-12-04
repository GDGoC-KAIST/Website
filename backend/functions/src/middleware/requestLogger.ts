import type {Request, Response, NextFunction} from "express";
import {randomUUID} from "crypto";
import {logger} from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = randomUUID();
  (req as Request & {id?: string}).id = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const latency = Date.now() - start;
    const userId = req.user?.sub;
    const meta = {
      requestId,
      userId,
      httpRequest: {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        latencyMs: latency,
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
