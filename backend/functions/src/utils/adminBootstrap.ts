import * as logger from "firebase-functions/logger";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {USERS_COLLECTION, UserStatus} from "../types/user";

async function upsertAdmin(adminId: string): Promise<void> {
  const docRef = db.collection(USERS_COLLECTION).doc(adminId);
  const snapshot = await docRef.get();

  if (snapshot.exists) {
    const data = snapshot.data() as {isAdmin?: boolean; status?: string};
    if (data?.isAdmin === true && data?.status === UserStatus.APPROVED) {
      logger.info("ADMIN_ID bootstrap skipped - admin already exists", {adminId});
      return;
    }

    await docRef.set({
      ...data,
      isAdmin: true,
      status: UserStatus.APPROVED,
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    logger.info("Existing user elevated to admin via ADMIN_ID", {adminId});
    return;
  }

  const timestamp = FieldValue.serverTimestamp();
  await docRef.set({
    githubId: `env-admin-${adminId}`,
    githubUsername: "env-admin",
    email: process.env.ADMIN_EMAIL || "admin@gdgoc.kaist",
    name: "GDGoC Bootstrap Admin",
    profileImageUrl: "",
    status: UserStatus.APPROVED,
    isAdmin: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  logger.info("Bootstrap admin document created from ADMIN_ID", {adminId});
}

export async function ensureEnvAdmin(): Promise<void> {
  const adminId = process.env.ADMIN_ID?.trim();
  if (!adminId) {
    return;
  }

  try {
    await upsertAdmin(adminId);
  } catch (error) {
    logger.error("Failed to bootstrap admin account from ADMIN_ID", {error});
  }
}

void ensureEnvAdmin();
