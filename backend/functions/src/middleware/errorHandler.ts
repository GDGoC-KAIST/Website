import type {Request, Response, NextFunction} from "express";
import {AppError} from "../utils/appError";
import * as logger from "firebase-functions/logger";

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.errorCode,
        message: error.message,
      },
    });
    return;
  }

  // Unexpected errors
  logger.error("Unhandled error", {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
