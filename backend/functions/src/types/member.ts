import {Timestamp} from "firebase-admin/firestore";

export type MemberRole = "Member" | "Core" | "Lead";

export interface MemberData {
  id?: string;
  name: string;
  email?: string;
  studentId?: string;
  department?: string;
  githubUsername?: string;
  profileImageUrl?: string;
  generation?: number;
  role?: MemberRole;
  blogName?: string;
  blogDescription?: string;
  isAdmin?: boolean;
  userId?: string;
  linkCodeHash?: string | null;
  linkCodeExpiresAt?: Timestamp | null;
  linkCodeUsedAt?: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const MEMBERS_COLLECTION = "members";
