import {db} from "../config/firebase";
import {MEMBERS_COLLECTION, MemberData} from "../types/member";

// Firestore 데이터 접근 레이어
export class MemberRepository {
  // 멤버 생성
  async create(memberData: Omit<MemberData, "id">): Promise<string> {
    const docRef = await db.collection(MEMBERS_COLLECTION).add(memberData);
    return docRef.id;
  }

  // 멤버 목록 조회
  async findAll(limit: number = 50, offset: number = 0): Promise<MemberData[]> {
    const snapshot = await db.collection(MEMBERS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as MemberData));
  }

  // 단일 멤버 조회
  async findById(memberId: string): Promise<MemberData | null> {
    const doc = await db.collection(MEMBERS_COLLECTION).doc(memberId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as MemberData;
  }

  // 이메일로 멤버 조회
  async findByEmail(email: string): Promise<MemberData | null> {
    const snapshot = await db.collection(MEMBERS_COLLECTION)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as MemberData;
  }

  // 멤버 업데이트
  async update(memberId: string, updateData: Partial<MemberData>): Promise<MemberData> {
    await db.collection(MEMBERS_COLLECTION)
      .doc(memberId)
      .update(updateData);

    const updatedDoc = await db.collection(MEMBERS_COLLECTION)
      .doc(memberId)
      .get();

    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as MemberData;
  }

  // 멤버 삭제
  async delete(memberId: string): Promise<void> {
    await db.collection(MEMBERS_COLLECTION).doc(memberId).delete();
  }
}

