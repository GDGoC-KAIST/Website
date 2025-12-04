import type {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import type {AccessTokenPayload} from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "";

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ") || !JWT_SECRET) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    req.user = decoded;
  } catch {
    // ignore errors for optional auth
  }
  next();
}
