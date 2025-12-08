import {getFirestore, Timestamp} from "firebase-admin/firestore";
import type {AbuseGuardStore, CheckResult} from "./types";

const COLLECTION = "opsAbuseCounters";

function sanitizeKey(key: string): string {
  return key.replace(new RegExp("[/\\s#?]", "g"), "_");
}

export class FirestoreAbuseGuardStore implements AbuseGuardStore {
  constructor(private readonly db = getFirestore()) {}

  async checkAndRecord(key: string, limit: number, windowSec: number, penaltySec: number): Promise<CheckResult> {
    const now = Date.now();
    const windowMs = windowSec * 1000;
    const docId = sanitizeKey(key);
    const ref = this.db.collection(COLLECTION).doc(docId);

    let result: CheckResult = {allowed: true, remaining: limit};

    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() as Record<string, unknown>) : {};

      const blockedUntilMs = typeof data.blockedUntilMs === "number" ? data.blockedUntilMs : 0;
      if (blockedUntilMs && blockedUntilMs > now) {
        result = {allowed: false, blockedUntil: blockedUntilMs, remaining: 0};
        return;
      }

      let windowStartedMs = typeof data.windowStartedMs === "number" ? data.windowStartedMs : now;
      let count = typeof data.count === "number" ? data.count : 0;

      if (now - windowStartedMs >= windowMs) {
        windowStartedMs = now;
        count = 0;
      }

      count += 1;
      const allowed = count <= limit;
      const remaining = allowed ? Math.max(0, limit - count) : 0;
      const newBlockedUntil = allowed ? undefined : now + penaltySec * 1000;

      tx.set(
        ref,
        {
          keyHash: key,
          count,
          windowStartedMs,
          blockedUntilMs: newBlockedUntil ?? null,
          updatedAt: Timestamp.fromMillis(now),
        },
        {merge: true}
      );

      result = {allowed, blockedUntil: newBlockedUntil, remaining};
    });

    return result;
  }
}
