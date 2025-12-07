import admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import type {Role} from "../../src/types/auth";
import {createAuthHeaders} from "../integration/setup";

export async function seedUser(uid: string, data: Record<string, unknown> = {}) {
  const defaults = {
    githubId: uid,
    githubUsername: `user-${uid}`,
    email: `${uid}@example.com`,
    name: "Test User",
    phone: "010-1234-5678",
    department: "Computer Science",
    studentId: "20240001",
    roles: ["USER"] as Role[],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await admin.firestore().collection("users").doc(uid).set({...defaults, ...data});
  return {uid, ...defaults, ...data};
}

export function authHeaderForUser(uid: string, roles: Role[] = ["USER"]): Record<string, string> {
  return createAuthHeaders(uid, roles);
}
