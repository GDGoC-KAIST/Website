import type {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import {AppError} from "../utils/appError";
import type {AccessTokenPayload} from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Missing or invalid Authorization header"
      );
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Access token is required"
      );
    }

    let decoded: AccessTokenPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          401,
          "TOKEN_EXPIRED",
          "Access token has expired"
        );
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(
          401,
          "INVALID_TOKEN",
          "Invalid access token"
        );
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
