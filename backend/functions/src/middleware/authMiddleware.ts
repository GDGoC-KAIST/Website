import type {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import {AppError} from "../utils/appError";
import type {AccessTokenPayload} from "../types/auth";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

    if (!JWT_SECRET) {
      throw new AppError(500, "INTERNAL_ERROR", "Authentication misconfigured");
    }

    const authHeader = req.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    let decoded: AccessTokenPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(401, "TOKEN_EXPIRED", "Authentication required");
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, "INVALID_TOKEN", "Authentication required");
      }

      throw error;
    }

    // Attach decoded payload to request
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
}
