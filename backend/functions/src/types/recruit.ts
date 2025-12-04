import { Timestamp } from "firebase-admin/firestore";

export type RecruitStatus = "submitted" | "reviewing" | "accepted" | "rejected" | "hold";

export interface RecruitApplication {
  id: string; // Document ID
  name: string;
  kaistEmail: string; // Unique Key
  googleEmail: string;
  phone: string;
  department: string;
  studentId: string; // Student ID Number

  // Essays (Max 600 chars)
  motivation: string;
  experience: string;
  wantsToDo: string;

  // Optional
  githubUsername?: string;
  portfolioUrl?: string;

  // Security & System
  passwordHash: string; // bcrypt hash
  failedAttempts: number;
  lockedUntil?: Timestamp | null;
  status: RecruitStatus;
  decisionEmailSentAt?: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecruitConfig {
  isOpen: boolean;
  openAt: Timestamp;
  closeAt: Timestamp;
  messageWhenClosed: string;
  semester?: string;
}
