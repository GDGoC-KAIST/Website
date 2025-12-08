import type {Timestamp} from "firebase-admin/firestore";

export interface UASummary {
  browser: string;
  os: string;
  device: string;
  isBot: boolean;
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface TelemetryData {
  visitorId: string;
  ipHash: string;
  uaSummary: UASummary;
  referrerHost?: string;
  utm?: UtmParams;
  path: string;
  method: string;
  status?: number;
  securityEvent?: string;
  rateLimited?: boolean;
}

export interface VisitorSession {
  sessionId: string;
  visitorId: string;
  startedAt: Timestamp;
  lastSeenAt: Timestamp;
  expiresAt: Timestamp;
  requestCount: number;
  ipHash: string;
  uaSummary: UASummary;
  day: string;
}

export interface VisitorPointer {
  currentSessionId: string;
  lastSessionId?: string;
  lastSeenAt: Timestamp;
  expiresAt: Timestamp;
  lastWriteAt: Timestamp;
}
