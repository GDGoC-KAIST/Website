import type {Request, Response, NextFunction} from "express";
import {AppError} from "../utils/appError";
import * as logger from "firebase-functions/logger";
import {ErrorCode} from "../utils/errorCodes";

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AppError) {
    const code = normalizeErrorCode(error.errorCode, error.statusCode);
    res.status(error.statusCode).json({
      error: {
        code,
        message: error.message,
        ...(error.details ? {details: error.details} : {}),
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
      code: ErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred",
    },
  });
}

function normalizeErrorCode(code: ErrorCode | string, statusCode: number): ErrorCode {
  const value = typeof code === "string" ? code.toUpperCase() : code;
  if (value === ErrorCode.VALIDATION_ERROR) return ErrorCode.VALIDATION_ERROR;
  if (value === ErrorCode.INVALID_INPUT || value === "INVALID_ARGUMENT" || value === "INVALID_REQUEST") {
    return ErrorCode.INVALID_INPUT;
  }
  if (value === ErrorCode.UNAUTHORIZED || value.includes("UNAUTHORIZED")) {
    return ErrorCode.UNAUTHORIZED;
  }
  if (value === ErrorCode.TOKEN_EXPIRED || value.includes("TOKEN_EXPIRED")) {
    return ErrorCode.TOKEN_EXPIRED;
  }
  if (
    value === ErrorCode.REFRESH_TOKEN_REUSED ||
    value.includes("REFRESH_REUSE")
  ) {
    return ErrorCode.REFRESH_TOKEN_REUSED;
  }
  if (value === ErrorCode.FORBIDDEN || value.includes("FORBIDDEN") || value.includes("MEMBER_ONLY")) {
    return ErrorCode.FORBIDDEN;
  }
  if (value === ErrorCode.INSUFFICIENT_ROLE || value.includes("INSUFFICIENT_ROLE")) {
    return ErrorCode.INSUFFICIENT_ROLE;
  }
  if (value === ErrorCode.NOT_FOUND || value.includes("NOT_FOUND")) {
    return ErrorCode.NOT_FOUND;
  }
  if (value === ErrorCode.ALREADY_EXISTS || value.includes("ALREADY")) {
    return ErrorCode.ALREADY_EXISTS;
  }
  if (value === ErrorCode.CONFLICT || value.includes("CONFLICT") || value.includes("LINK_CODE_USED")) {
    return ErrorCode.CONFLICT;
  }
  if (value === ErrorCode.TOO_MANY_REQUESTS || value.includes("TOO_MANY") || value.includes("RATE_LIMIT")) {
    return ErrorCode.TOO_MANY_REQUESTS;
  }
  if (value === ErrorCode.INTERNAL_ERROR) {
    return ErrorCode.INTERNAL_ERROR;
  }

  if (statusCode === 401) return ErrorCode.UNAUTHORIZED;
  if (statusCode === 403) return ErrorCode.FORBIDDEN;
  if (statusCode === 404) return ErrorCode.NOT_FOUND;
  if (statusCode === 409) return ErrorCode.CONFLICT;
  if (statusCode === 429) return ErrorCode.TOO_MANY_REQUESTS;
  if (statusCode >= 500) return ErrorCode.INTERNAL_ERROR;
  return ErrorCode.INVALID_INPUT;
}
