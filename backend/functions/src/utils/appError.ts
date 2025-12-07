import {ErrorCode} from "./errorCodes";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode | string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, errorCode: ErrorCode | string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, errorCode: ErrorCode | string = ErrorCode.INVALID_INPUT) {
    return new AppError(400, errorCode, message);
  }

  static payloadTooLarge(message: string) {
    return new AppError(413, ErrorCode.PAYLOAD_TOO_LARGE, message);
  }

  static unauthorized(message: string) {
    return new AppError(401, ErrorCode.UNAUTHORIZED, message);
  }

  static forbidden(message: string) {
    return new AppError(403, ErrorCode.FORBIDDEN, message);
  }

  static notFound(message: string) {
    return new AppError(404, ErrorCode.NOT_FOUND, message);
  }

  static internal(message: string) {
    return new AppError(500, ErrorCode.INTERNAL_ERROR, message);
  }
}
