import {getFirestore, Timestamp} from "firebase-admin/firestore";
import * as crypto from "crypto";

const db = getFirestore();

/**
 * Seeds a recruit session in Firestore.
 * @param email - Email address for the session
 * @returns Object with token and normalized email
 */
export async function seedRecruitSession(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const normalizedEmail = email.trim().toLowerCase();
  await db.collection("recruitSessions").doc(token).set({
    email: normalizedEmail,
    createdAt: Timestamp.now(),
  });
  return {token, email: normalizedEmail};
}

/**
 * Seeds a recruit application in Firestore.
 * @param kaistEmail - KAIST email address (will be normalized and used as doc ID)
 * @param passwordHash - Hashed password (default: "hashed-password")
 * @param overrides - Additional fields to override defaults
 * @returns Object with normalized email
 */
export async function seedRecruitApplication(
  kaistEmail: string,
  passwordHash: string = "hashed-password",
  overrides: Record<string, any> = {}
) {
  const normalizedEmail = kaistEmail.trim().toLowerCase();
  await db.collection("recruitApplications").doc(normalizedEmail).set({
    id: normalizedEmail,
    name: "Test User",
    kaistEmail: normalizedEmail,
    googleEmail: "test@gmail.com",
    phone: "010-1234-5678",
    department: "Computer Science",
    studentId: "20240001",
    motivation: "Test motivation",
    experience: "Test experience",
    wantsToDo: "Test goals",
    passwordHash,
    failedAttempts: 0,
    lockedUntil: null,
    status: "submitted",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  });
  return {email: normalizedEmail};
}

/**
 * Seeds recruit configuration in Firestore.
 * @param isOpen - Whether recruiting is open
 * @returns void
 */
export async function seedRecruitConfig(isOpen: boolean = true) {
  await db.collection("recruitConfig").doc("current").set({
    isOpen,
    openAt: Timestamp.now(),
    closeAt: Timestamp.fromMillis(Date.now() + 86400000), // 24 hours from now
    messageWhenClosed: "Recruiting is currently closed.",
    semester: "2024-Fall",
  });
}

/**
 * Clears all recruit-related collections for testing.
 * @returns void
 */
export async function clearRecruitData() {
  const collections = ["recruitSessions", "recruitApplications", "recruitConfig"];
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}
