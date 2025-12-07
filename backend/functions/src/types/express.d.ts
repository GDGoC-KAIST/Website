import "express";
import type {AccessTokenPayload} from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      telemetry?: {
        ipHash?: string;
        uaSummary?: {
          deviceType?: string;
          browserFamily?: string;
          osFamily?: string;
          isBot?: boolean;
        };
      };
    }
  }
}

export {};
