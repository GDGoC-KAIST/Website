import {randomUUID} from "node:crypto";
import {Timestamp, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import type {TelemetryData, VisitorPointer, VisitorSession} from "../types/telemetry";
import {incrementCounters} from "../repositories/opsAggRepo";

const POINTERS = "visitorPointers";
const SESSIONS = "visitorSessions";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WRITE_THROTTLE_MS = 7_000;

export class VisitorSessionService {
  constructor(private readonly db = getFirestore()) {}

  async upsertSession(
    telemetry: TelemetryData,
    sessionTimeoutMs: number = SESSION_TIMEOUT_MS
  ): Promise<string> {
    const nowMs = Date.now();
    const now = Timestamp.fromMillis(nowMs);
    const expiresAt = Timestamp.fromMillis(nowMs + sessionTimeoutMs);
    const day = new Date(nowMs).toISOString().slice(0, 10);
    const hour = new Date(nowMs).getUTCHours().toString().padStart(2, "0");
    const pointerRef = this.db.collection(POINTERS).doc(telemetry.visitorId);

    let sessionId = "";
    let isNewSession = false;
    let shouldAggregate = true;

    try {
      await this.db.runTransaction(async (tx) => {
        const pointerSnap = await tx.get(pointerRef);
        const pointer = pointerSnap.exists ?
          (pointerSnap.data() as Partial<VisitorPointer>) :
          undefined;
        const lastSessionId = pointer?.currentSessionId || pointer?.lastSessionId;

        const sessionRef = lastSessionId ? this.db.collection(SESSIONS).doc(lastSessionId) : null;
        const sessionSnap = sessionRef ? await tx.get(sessionRef) : null;
        const sessionData = sessionSnap?.exists ?
          (sessionSnap.data() as Partial<VisitorSession>) :
          undefined;

        const sessionExpired = !sessionData?.expiresAt || nowMs > sessionData.expiresAt.toMillis();
        const sessionStale =
          !sessionData?.lastSeenAt || nowMs - sessionData.lastSeenAt.toMillis() > sessionTimeoutMs;

        if (!lastSessionId || !sessionData || sessionExpired || sessionStale) {
          const newSessionId = randomUUID();
          const newSessionRef = this.db.collection(SESSIONS).doc(newSessionId);
          const sessionDoc: VisitorSession = {
            sessionId: newSessionId,
            visitorId: telemetry.visitorId,
            startedAt: now,
            lastSeenAt: now,
            expiresAt,
            requestCount: 1,
            ipHash: telemetry.ipHash,
            uaSummary: telemetry.uaSummary,
            day,
          };

          tx.set(newSessionRef, sessionDoc);
          tx.set(
            pointerRef,
            {
              lastSessionId: newSessionId,
              currentSessionId: newSessionId,
              lastSeenAt: now,
              expiresAt,
              lastWriteAt: now,
            },
            {merge: true}
          );

          sessionId = newSessionId;
          isNewSession = true;
          return;
        }

        const lastWriteAtMs = pointer?.lastWriteAt?.toMillis?.() ?? 0;
        const throttled = nowMs - lastWriteAtMs < WRITE_THROTTLE_MS;

        if (throttled) {
          // keep sessionId and skip writes/aggregation
          sessionId = lastSessionId;
          shouldAggregate = false;
          return;
        }

        if (sessionRef) {
          const requestCount = (sessionData.requestCount || 0) + 1;
          tx.set(
            sessionRef,
            {
              lastSeenAt: now,
              expiresAt,
              requestCount,
              uaSummary: telemetry.uaSummary,
              ipHash: telemetry.ipHash,
            },
            {merge: true}
          );
          tx.set(
            pointerRef,
            {
              lastSeenAt: now,
              expiresAt,
              lastWriteAt: now,
              lastSessionId,
              currentSessionId: lastSessionId,
            },
            {merge: true}
          );
          sessionId = lastSessionId;
          shouldAggregate = true;
        }
      });

      if (!shouldAggregate) {
        return sessionId;
      }

      const batch = this.db.batch();
      await incrementCounters(batch, day, hour, telemetry, isNewSession);
      await batch.commit();

      return sessionId;
    } catch (error) {
      logger.error("Visitor session write failed", {error});
      return sessionId;
    }
  }
}

export const visitorSessionService = new VisitorSessionService();
