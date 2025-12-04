import {db} from "../config/firebase";
import {USERS_COLLECTION, UserStatus} from "../types/user";
import {FieldValue} from "firebase-admin/firestore";

interface SeedResult {
  adminId: string;
  existed: boolean;
}

export class SeedService {
  async createInitialAdmin(): Promise<SeedResult> {
    const existingSnapshot = await db
      .collection(USERS_COLLECTION)
      .where("isAdmin", "==", true)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      const existingAdmin = existingSnapshot.docs[0];
      return {adminId: existingAdmin.id, existed: true};
    }

    const docRef = await db.collection(USERS_COLLECTION).add({
      githubId: "seed-admin-github-id",
      githubUsername: "SuperAdmin",
      email: "admin@gdgoc.kaist",
      name: "GDGoC Root Admin",
      profileImageUrl: "",
      status: UserStatus.APPROVED,
      isAdmin: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {adminId: docRef.id, existed: false};
  }
}
