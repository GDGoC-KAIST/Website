import {Timestamp} from "firebase-admin/firestore";

export type OutboxType = "recruit.applicationReceived" | "recruit.temporaryPassword";

export interface OutboxMessage {
  type: OutboxType;
  to: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  attempts: number;
  lastError?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
