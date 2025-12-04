import crypto from "node:crypto";
import {AppError} from "./appError";

function getSecret(name: string, fallback?: string): string {
  const secret = process.env[name] ?? (fallback ? process.env[fallback] : undefined);
  if (!secret) {
    throw new AppError(500, "SERVER_CONFIG_ERROR", `${name} is not configured`);
  }
  return secret;
}

export function hashLinkCode(code: string): string {
  const secret = getSecret("LINK_CODE_SECRET", "REFRESH_TOKEN_SECRET");
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

export function generateRandomToken(bytes: number = 48): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function generateLinkCode(): string {
  const raw = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
