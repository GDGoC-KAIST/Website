import {FieldValue, getFirestore} from "firebase-admin/firestore";
import type {TelemetryData} from "../types/telemetry";

function sanitizeKey(raw: string | undefined): string {
  if (!raw) return "unknown";
  return raw.replace(/\./g, "_").slice(0, 100);
}

function buildIncrementDoc(telemetry: TelemetryData, isNewSession: boolean) {
  const browserKey = sanitizeKey(telemetry.uaSummary?.browser);
  const osKey = sanitizeKey(telemetry.uaSummary?.os);
  const referrerKey = sanitizeKey(telemetry.referrerHost || "direct");

  const base: Record<string, unknown> = {
    requestsTotal: FieldValue.increment(1),
    browserFamilyCount: {[browserKey]: FieldValue.increment(1)},
    osFamilyCount: {[osKey]: FieldValue.increment(1)},
    referrerHostCount: {[referrerKey]: FieldValue.increment(1)},
  };

  if (isNewSession) {
    base.sessionsStarted = FieldValue.increment(1);
    base.uniqueVisitorsApprox = FieldValue.increment(1);
  }

  return base;
}

export async function incrementCounters(
  writer: FirebaseFirestore.WriteBatch,
  day: string,
  hour: string,
  telemetry: TelemetryData,
  isNewSession: boolean
): Promise<void> {
  const db = getFirestore();
  const dailyRef = db.collection("opsDailyAgg").doc(day);
  const hourlyRef = db.collection("opsHourlyAgg").doc(day).collection("hours").doc(hour);

  const dailyDoc = buildIncrementDoc(telemetry, isNewSession) as FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData>;
  const hourlyDoc = buildIncrementDoc(telemetry, isNewSession) as FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData>;

  writer.set(dailyRef, dailyDoc, {merge: true});
  writer.set(hourlyRef, hourlyDoc, {merge: true});
}
