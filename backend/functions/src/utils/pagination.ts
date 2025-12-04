import type {Request} from "express";

export function encodeCursor(val: unknown, id: string): string {
  const payload = {val, id};
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor?: string): {val: unknown; id: string} | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (typeof parsed?.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parsePaginationParams(req: Request): {limit: number; cursor?: string} {
  const rawLimit = req.query.limit ? Number(req.query.limit) : undefined;
  let limit = 20;
  if (rawLimit && !Number.isNaN(rawLimit) && rawLimit > 0) {
    limit = Math.min(rawLimit, 100);
  }
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  return {limit, cursor};
}
