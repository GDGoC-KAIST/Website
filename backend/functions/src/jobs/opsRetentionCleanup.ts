import {Timestamp, getFirestore} from "firebase-admin/firestore";

const VISITOR_SESSIONS = "visitorSessions";
const VISITOR_POINTERS = "visitorPointers";
const DEFAULT_BATCH = 500;
const SESSION_RETENTION_DAYS = 90;
const POINTER_RETENTION_DAYS = 7;

export interface RetentionCleanupResult {
  sessionsDeleted: number;
  pointersDeleted: number;
}

async function deleteOlderThan(
  collection: string,
  field: "lastSeenAt" | "expiresAt",
  cutoff: Timestamp,
  batchSize: number,
  dryRun: boolean
): Promise<number> {
  const db = getFirestore();
  let deleted = 0;

  // Loop until fewer than batchSize records remain
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await db.collection(collection).where(field, "<", cutoff).limit(batchSize).get();
    if (snap.empty) {
      break;
    }

    const batch = db.batch();
    snap.forEach((doc) => batch.delete(doc.ref));

    if (!dryRun) {
      await batch.commit();
    }

    deleted += snap.size;

    if (snap.size < batchSize) {
      break;
    }
  }

  return deleted;
}

export async function runOpsRetentionCleanup(options?: {
  now?: Date;
  batchSize?: number;
  dryRun?: boolean;
}): Promise<RetentionCleanupResult> {
  const now = options?.now ?? new Date();
  const batchSize = options?.batchSize ?? DEFAULT_BATCH;
  const dryRun = options?.dryRun ?? false;
  const nowMs = now.getTime();

  const sessionCutoff = Timestamp.fromMillis(nowMs - SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const pointerCutoff = Timestamp.fromMillis(nowMs - POINTER_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const [sessionsDeleted, pointersDeleted] = await Promise.all([
    deleteOlderThan(VISITOR_SESSIONS, "lastSeenAt", sessionCutoff, batchSize, dryRun),
    deleteOlderThan(VISITOR_POINTERS, "expiresAt", pointerCutoff, batchSize, dryRun),
  ]);

  return {sessionsDeleted, pointersDeleted};
}
