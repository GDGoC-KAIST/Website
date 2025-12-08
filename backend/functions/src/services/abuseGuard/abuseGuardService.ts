import type {TelemetryData} from "../../types/telemetry";
import type {AbuseGuardStore, CheckResult} from "./types";
import {FirestoreAbuseGuardStore} from "./firestoreAbuseGuardStore";
import {RedisAbuseGuardStore} from "./redisAbuseGuardStore";
import {env} from "../../config/env";

const store: AbuseGuardStore =
  env.abuseGuardStore === "redis" ? new RedisAbuseGuardStore() : new FirestoreAbuseGuardStore();

function buildKey(routeKey: string, telemetry?: TelemetryData): string {
  const hashedIdentity = telemetry?.visitorId || telemetry?.ipHash || "anonymous";
  return `${routeKey}:${hashedIdentity}`;
}

export async function check(
  routeKey: string,
  telemetry: TelemetryData | undefined,
  limit: number,
  windowSec: number,
  penaltySec: number
): Promise<CheckResult> {
  return store.checkAndRecord(buildKey(routeKey, telemetry), limit, windowSec, penaltySec);
}

export function getStore(): AbuseGuardStore {
  return store;
}
