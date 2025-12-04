import {
  Timestamp,
  type Transaction,
  type DocumentReference,
  type DocumentSnapshot,
} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {Session} from "../types/session";

export type SessionData = Omit<Session, "id">;

const COLLECTION = "sessions";
const BATCH_LIMIT = 400;

export class SessionRepo {
  private collection = db.collection(COLLECTION);

  doc(sessionId: string): DocumentReference<SessionData> {
    return this.collection.doc(sessionId) as DocumentReference<SessionData>;
  }

  async createSession(sessionId: string, data: SessionData): Promise<void> {
    await this.doc(sessionId).set(data);
  }

  createSessionTx(tx: Transaction, sessionId: string, data: SessionData): void {
    tx.set(this.doc(sessionId), data);
  }

  async findById(sessionId: string, tx?: Transaction): Promise<Session | null> {
    const ref = this.doc(sessionId);
    const snap = tx ? await tx.get(ref) : await ref.get();
    if (!snap.exists) {
      return null;
    }
    return this.toSession(snap);
  }

  async revokeSession(sessionId: string, tx?: Transaction): Promise<void> {
    const ref = this.doc(sessionId);
    const payload = {revokedAt: Timestamp.now()};
    if (tx) {
      tx.set(ref, payload, {merge: true});
      return;
    }
    await ref.set(payload, {merge: true});
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const now = Timestamp.now();
    const snapshot = await this.collection.where("userId", "==", userId).get();
    if (snapshot.empty) {
      return;
    }

    for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      const slice = snapshot.docs.slice(i, i + BATCH_LIMIT);
      slice.forEach((doc) => {
        batch.set(doc.ref, {revokedAt: now}, {merge: true});
      });
      await batch.commit();
    }
  }

  async runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    return db.runTransaction(fn);
  }

  private toSession(snapshot: DocumentSnapshot<SessionData>): Session {
    const data = snapshot.data();
    if (!data) {
      throw new Error("Session snapshot has no data");
    }
    return {
      id: snapshot.id,
      ...data,
    };
  }
}
