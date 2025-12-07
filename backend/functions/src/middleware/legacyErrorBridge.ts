import type {Request, Response, NextFunction} from "express";
import {AppError} from "../utils/appError";

export function legacyErrorBridge(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({error: err.message});
    return;
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({error: message || "Internal Server Error"});
}
