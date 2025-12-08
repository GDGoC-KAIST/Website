import {randomUUID} from "node:crypto";
import type {Request, Response, NextFunction} from "express";
import * as logger from "firebase-functions/logger";
import {hashIp} from "../utils/ipHash";
import {summarizeUa} from "../utils/uaSummary";
import {getReferrerHost} from "../utils/referrer";
import {getUtm} from "../utils/utm";
import {visitorSessionService} from "../services/visitorSessionService";
import type {TelemetryData} from "../types/telemetry";
import {env} from "../config/env";

const SALT = env.ipHashSalt;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export async function telemetryMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const visitorId = (req.get("x-visitor-id") || req.get("X-Visitor-Id") || "").trim() || randomUUID();
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || req.ip;
    const userAgent = (req.headers["user-agent"] as string) || "";
    const referrerHost = getReferrerHost(req.get("referer") || req.get("referrer") || undefined);
    const utm = getUtm(req.query as Record<string, unknown>);
    const path = req.path || "/";
    const {method} = req;

    const telemetry: TelemetryData = {
      visitorId,
      ipHash: hashIp(ip, SALT),
      uaSummary: summarizeUa(userAgent),
      referrerHost,
      utm,
      path,
      method,
    };

    req.telemetry = telemetry;

    try {
      await visitorSessionService.upsertSession(telemetry, SESSION_TIMEOUT_MS);
    } catch (error) {
      // Non-critical: fall back gracefully when writes are throttled or Firestore is unavailable
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("Telemetry write skipped", {error: message});
    }

    logger.info("telemetry", {
      visitorId,
      ipHash: telemetry.ipHash,
      browser: telemetry.uaSummary.browser,
      os: telemetry.uaSummary.os,
      device: telemetry.uaSummary.device,
      isBot: telemetry.uaSummary.isBot,
      referrer: referrerHost || "none",
    });

    // Maintain stdout summary for existing telemetry tests while avoiding raw UA/IP
    console.log(
      `[telemetry] visitorId=${visitorId} ipHash=${telemetry.ipHash} browser=${telemetry.uaSummary.browser} os=${telemetry.uaSummary.os} device=${telemetry.uaSummary.device} isBot=${telemetry.uaSummary.isBot} referrer=${referrerHost || "none"}`
    );

    next();
  } catch (error) {
    next(error);
  }
}
