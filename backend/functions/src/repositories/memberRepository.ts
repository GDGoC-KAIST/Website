import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {MEMBERS_COLLECTION, MemberData} from "../types/member";
import {AppError} from "../utils/appError";

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

  // 관리자 멤버 목록 조회
  async findAdmins(): Promise<MemberData[]> {
    const snapshot = await db.collection(MEMBERS_COLLECTION)
      .where("isAdmin", "==", true)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as MemberData));
  }
}

export interface Member extends MemberData {
  id: string;
}

export class MemberRepo {
  private collection = db.collection(MEMBERS_COLLECTION);

  async findById(memberId: string): Promise<Member | null> {
    const doc = await this.collection.doc(memberId).get();
    if (!doc.exists) return null;
    return {
      id: doc.id,
      ...(doc.data() as MemberData),
    };
  }

  async findByLinkCodeHash(hash: string): Promise<Member | null> {
    const snapshot = await this.collection.where("linkCodeHash", "==", hash).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...(doc.data() as MemberData),
    };
  }

  async linkUserToMember(memberId: string, userId: string): Promise<void> {
    const memberRef = this.collection.doc(memberId);
    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (tx) => {
      const memberSnap = await tx.get(memberRef);
      if (!memberSnap.exists) {
        throw new AppError(404, "LINK_CODE_INVALID", "Member not found");
      }

      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new AppError(404, "USER_NOT_FOUND", "User not found");
      }

      tx.update(memberRef, {
        userId,
        linkCodeUsedAt: FieldValue.serverTimestamp(),
        linkCodeHash: FieldValue.delete(),
        linkCodeExpiresAt: FieldValue.delete(),
      });

      tx.update(userRef, {
        memberId,
        roles: FieldValue.arrayUnion("MEMBER"),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async findByStudentId(studentId: string): Promise<Member | null> {
    const snapshot = await this.collection.where("studentId", "==", studentId).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...(doc.data() as MemberData),
    };
  }

  async createMember(data: MemberData): Promise<Member> {
    const now = Timestamp.now();
    const docRef = await this.collection.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    const snapshot = await docRef.get();
    return {
      id: docRef.id,
      ...(snapshot.data() as MemberData),
    };
  }

  async updateMemberLinkCode(memberId: string, hash: string, expiresAt: Date): Promise<Member> {
    const memberRef = this.collection.doc(memberId);
    await memberRef.update({
      linkCodeHash: hash,
      linkCodeExpiresAt: Timestamp.fromDate(expiresAt),
      linkCodeUsedAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const snapshot = await memberRef.get();
    if (!snapshot.exists) {
      throw new AppError(404, "MEMBER_NOT_FOUND", "Member not found");
    }
    return {
      id: snapshot.id,
      ...(snapshot.data() as MemberData),
    };
  }
}
