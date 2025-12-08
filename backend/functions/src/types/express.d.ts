import "express";
import type {AccessTokenPayload} from "./auth";
import type {TelemetryData} from "./telemetry";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      telemetry?: TelemetryData;
    }
  }
}

export {};
