import {ErrorCode} from "./errorCodes";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, errorCode: ErrorCode | string, message: string, details?: unknown) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = (errorCode as ErrorCode);
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
