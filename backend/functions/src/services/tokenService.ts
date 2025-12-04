import jwt from "jsonwebtoken";
import type {SignOptions, Secret} from "jsonwebtoken";
import {Timestamp} from "firebase-admin/firestore";
import {AccessTokenPayload} from "../types/auth";
import {AppError} from "../utils/appError";
import {generateRandomToken, hashToken} from "../utils/hash";
import {SessionData} from "../repositories/sessionRepo";

type AccessTokenClaims = Omit<AccessTokenPayload, "iat" | "exp">;

const ACCESS_TOKEN_EXPIRY: NonNullable<SignOptions["expiresIn"]> =
  (process.env.JWT_ACCESS_EXPIRY as SignOptions["expiresIn"]) ?? "15m";
const REFRESH_TTL_MS = resolveDurationToMs(process.env.JWT_REFRESH_EXPIRY) ?? 30 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_OPTIONS: SignOptions = {
  expiresIn: ACCESS_TOKEN_EXPIRY,
  algorithm: "HS256",
};

export function generateAccessToken(claims: AccessTokenClaims): string {
  const secretValue = process.env.JWT_SECRET;
  if (!secretValue) {
    throw new AppError(500, "SERVER_CONFIG_ERROR", "JWT_SECRET is not configured");
  }

  const secret: Secret = secretValue;
  return jwt.sign(claims, secret, ACCESS_TOKEN_OPTIONS);
}

export function generateRefreshToken(): string {
  return generateRandomToken(48);
}

interface SessionPayloadInput {
  userId: string;
  refreshToken: string;
  ip?: string;
  userAgent?: string;
}

export function createSessionPayload(input: SessionPayloadInput): SessionData {
  const now = Timestamp.now();
  return {
    userId: input.userId,
    refreshTokenHash: hashToken(input.refreshToken),
    createdAt: now,
    expiresAt: Timestamp.fromMillis(now.toMillis() + REFRESH_TTL_MS),
    ip: input.ip,
    userAgent: input.userAgent,
  };
}

function resolveDurationToMs(value?: string): number | undefined {
  if (!value) return undefined;
  const match = /^(\d+)([smhd])$/i.exec(value);
  if (!match) return undefined;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return undefined;
  }
}
