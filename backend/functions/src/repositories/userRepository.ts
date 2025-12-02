import {db} from "../config/firebase";
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

  // 승인된 사용자 목록 조회
  async findApprovedUsers(limit: number = 100, offset: number = 0): Promise<UserData[]> {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where("status", "==", UserStatus.APPROVED)
      .orderBy("createdAt", "asc")
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

