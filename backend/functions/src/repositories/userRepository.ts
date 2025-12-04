import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {Role} from "../types/auth";
import {USERS_COLLECTION, UserData, UserStatus} from "../types/user";

// Firestore 데이터 접근 레이어
export class UserRepository {
  // 사용자 생성
  async create(userData: Omit<UserData, "id">): Promise<string> {
    const docRef = await db.collection(USERS_COLLECTION).add(userData);
    return docRef.id;
  }

  // GitHub ID로 사용자 조회
  async findByGithubId(githubId: string): Promise<UserData | null> {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where("githubId", "==", githubId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as UserData;
  }

  // 사용자 ID로 조회
  async findById(userId: string): Promise<UserData | null> {
    const doc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as UserData;
  }

  // 승인 대기 중인 사용자 목록 조회
  async findPendingUsers(limit: number = 50, offset: number = 0): Promise<UserData[]> {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where("status", "==", UserStatus.PENDING)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as UserData));
  }

  // 사용자 업데이트
  async update(userId: string, updateData: Partial<UserData>): Promise<UserData> {
    await db.collection(USERS_COLLECTION)
      .doc(userId)
      .update(updateData);

    const updatedDoc = await db.collection(USERS_COLLECTION)
      .doc(userId)
      .get();

    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as UserData;
  }

  // 사용자 삭제
  async delete(userId: string): Promise<void> {
    await db.collection(USERS_COLLECTION).doc(userId).delete();
  }
}

export interface GitHubProfile {
  id: number;
  login: string;
  name?: string | null;
  email: string;
  avatar_url?: string | null;
}

export interface User {
  id: string;
  githubId: string;
  githubUsername: string;
  email: string;
  name: string;
  githubProfileImageUrl: string;
  profileImageUrl?: string | null;
  memberId?: string;
  roles: Role[];
  bio?: string;
  stacks?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}

export class UserRepo {
  private collection = db.collection(USERS_COLLECTION);

  async upsertUser(profile: GitHubProfile): Promise<User> {
    const docId = String(profile.id);
    const docRef = this.collection.doc(docId);
    const snapshot = await docRef.get();
    const now = Timestamp.now();

    if (!snapshot.exists) {
      const newUser: Omit<User, "id"> = {
        githubId: docId,
        githubUsername: profile.login,
        email: profile.email,
        name: profile.name ?? profile.login,
        githubProfileImageUrl: profile.avatar_url ?? "",
        roles: ["USER"],
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };
      await docRef.set(newUser);
      return {id: docId, ...newUser};
    }

    const existing = snapshot.data() as Partial<User>;
    const roles = this.normalizeRoles(existing.roles);

    const updatedFields: Partial<User> = {
      githubId: docId,
      githubUsername: profile.login,
      email: profile.email,
      name: profile.name ?? profile.login,
      githubProfileImageUrl: profile.avatar_url ?? existing.githubProfileImageUrl ?? "",
      roles,
      updatedAt: now,
      lastLoginAt: now,
    };

    await docRef.set(updatedFields, {merge: true});
    const updatedSnapshot = await docRef.get();
    const updated = updatedSnapshot.data() as Omit<User, "id">;
    return {id: docId, ...updated};
  }

  async findById(userId: string): Promise<User | null> {
    const snap = await this.collection.doc(userId).get();
    if (!snap.exists) return null;
    const stored = snap.data() as Omit<User, "id">;
    return {id: snap.id, ...stored};
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    await this.collection.doc(userId).set(
      {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );
}

  private normalizeRoles(roles?: Role[] | string[]): Role[] {
    if (!Array.isArray(roles) || roles.length === 0) {
      return ["USER"];
    }
    const allowed: Role[] = [];
    roles.forEach((role) => {
      if (role === "USER" || role === "MEMBER" || role === "ADMIN") {
        allowed.push(role);
      }
    });
    return allowed.length > 0 ? allowed : ["USER"];
  }
}
