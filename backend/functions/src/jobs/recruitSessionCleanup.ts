import {getFirestore, Timestamp} from "firebase-admin/firestore";

export async function cleanupExpiredSessions(dryRun = false): Promise<number> {
  const db = getFirestore();
  const cutoff = Timestamp.now();
  const snapshot = await db
    .collection("recruitSessions")
    .where("expiresAt", "<", cutoff)
    .limit(500)
    .get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));

  if (!dryRun) {
    await batch.commit();
  }

  return snapshot.size;
}
