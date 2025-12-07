import type {Request, Response, NextFunction} from "express";
import {AppError} from "../utils/appError";

export function recruitLegacyErrorBridge(
  err: Error,
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

  const message = err.message || "Internal Server Error";
  res.status(500).json({error: message});
}
