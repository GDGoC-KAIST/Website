import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import type {OutboxMessage, OutboxType} from "./types";

const OUTBOX_COLLECTION = "recruitOutbox";

export async function enqueueOutboxMessage(
  type: OutboxType,
  to: string,
  payload: Record<string, unknown>
): Promise<void> {
  const now = Timestamp.now();
  const message: OutboxMessage = {
    type,
    to,
    payload,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(OUTBOX_COLLECTION).add(message);
}
