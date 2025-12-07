import {getFirestore} from "firebase-admin/firestore";
import {hashLinkCode} from "../../src/utils/hash";
import {createAuthHeaders} from "../integration/setup";

export function getAdminAuthHeaders(): Record<string, string> {
  return createAuthHeaders("admin-user", ["ADMIN"]);
}

export async function seedMemberDoc(memberId: string, data: Record<string, unknown> = {}): Promise<void> {
  const db = getFirestore();
  const base = {
    name: "Admin Test Member",
    studentId: "20250001",
    department: "CS",
    generation: 1,
    role: "Lead",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection("members").doc(memberId).set({...base, ...data});
}

export async function getStoredLinkCode(memberId: string) {
  const db = getFirestore();
  const doc = await db.collection("members").doc(memberId).get();
  return doc.data();
}

export function hashLinkCodeForTest(code: string): string {
  return hashLinkCode(code);
}
