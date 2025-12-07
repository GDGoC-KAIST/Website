import type {NextFunction, Request, Response} from "express";
import {ErrorCode} from "../utils/errorCodes";

// Drain oversized uploads and return a consistent 413 JSON response to avoid client-side ECONNRESET.
export function uploadErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const maybe = err as {code?: string; statusCode?: number; message?: string};
  const isSizeError = maybe?.code === "LIMIT_FILE_SIZE" || maybe?.statusCode === 413;

  if (!isSizeError) {
    return next(err);
  }

  if (!req.readableEnded) {
    req.resume();
  }

  if (!res.headersSent) {
    const requestId = (req as Request & {id?: string}).id;
    res.status(413).json({
      error: {
        code: ErrorCode.PAYLOAD_TOO_LARGE,
        message: maybe?.message || "File too large (max 5MB)",
        ...(requestId ? {requestId} : {}),
      },
    });
    return;
  }

  return next(err);
}
