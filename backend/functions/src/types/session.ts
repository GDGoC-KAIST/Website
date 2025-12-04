import {Timestamp} from "firebase-admin/firestore";

export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  rotatedAt?: Timestamp | null;
  revokedAt?: Timestamp | null;
  replacedBy?: string | null;
  ip?: string;
  userAgent?: string;
}
