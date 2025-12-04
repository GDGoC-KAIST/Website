import type {Response} from "express";

const DEFAULT_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const DEFAULT_HEADERS = "Content-Type,Authorization";

export function setCorsHeaders(res: Response): void {
  const origin = process.env.CORS_ALLOW_ORIGIN ?? "*";
  const methods = process.env.CORS_ALLOW_METHODS ?? DEFAULT_METHODS;
  const headers = process.env.CORS_ALLOW_HEADERS ?? DEFAULT_HEADERS;

  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", methods);
  res.header("Access-Control-Allow-Headers", headers);
  res.header("Access-Control-Allow-Credentials", "true");
}
