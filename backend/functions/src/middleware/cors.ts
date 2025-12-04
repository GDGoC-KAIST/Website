import {Request, Response, NextFunction} from "express";
import {AppError} from "../utils/appError";

const rawAllowlist = process.env.CORS_ALLOWLIST ?? "";
const ALLOWED_ORIGINS = rawAllowlist
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.length === 0) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function applyCorsHeaders(res: Response, origin?: string | null) {
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get("origin");

  if (!isAllowedOrigin(origin)) {
    if (req.method === "OPTIONS") {
      res.status(403).send("CORS origin forbidden");
      return;
    }
    next(new AppError(403, "CORS_FORBIDDEN", "Origin not allowed"));
    return;
  }

  applyCorsHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  next();
}
