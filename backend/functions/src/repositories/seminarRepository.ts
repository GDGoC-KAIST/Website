import {db} from "../config/firebase";
import {SEMINARS_COLLECTION, SeminarDoc, SeminarType} from "../types/seminar";

// Firestore 데이터 접근 레이어
export class SeminarRepository {
  async create(seminarData: Omit<SeminarDoc, "id">): Promise<string> {
    const docRef = await db.collection(SEMINARS_COLLECTION).add(seminarData);
    return docRef.id;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    filters?: {
      semester?: string;
      type?: SeminarType;
    }
  ): Promise<SeminarDoc[]> {
    let query = db.collection(SEMINARS_COLLECTION)
      .orderBy("createdAt", "desc");

    if (filters?.semester) {
      query = query.where("semester", "==", filters.semester);
    }
    if (filters?.type) {
      query = query.where("type", "==", filters.type);
    }

    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as SeminarDoc));
  }

  async findById(seminarId: string): Promise<SeminarDoc | null> {
    const doc = await db.collection(SEMINARS_COLLECTION).doc(seminarId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as SeminarDoc;
  }

  async update(seminarId: string, updateData: Partial<SeminarDoc>): Promise<SeminarDoc> {
    await db.collection(SEMINARS_COLLECTION)
      .doc(seminarId)
      .update(updateData);

    const updatedDoc = await db.collection(SEMINARS_COLLECTION)
      .doc(seminarId)
      .get();

    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as SeminarDoc;
  }

  async delete(seminarId: string): Promise<void> {
    await db.collection(SEMINARS_COLLECTION).doc(seminarId).delete();
  }
}
