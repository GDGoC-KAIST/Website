import {db} from "../config/firebase";
import {IMAGES_COLLECTION, ImageData} from "../types/image";

// Firestore 데이터 접근 레이어
export class ImageRepository {
  // 이미지 생성
  async create(imageData: Omit<ImageData, "id">): Promise<string> {
    const docRef = await db.collection(IMAGES_COLLECTION).add(imageData);
    return docRef.id;
  }

  // 이미지 목록 조회
  async findAll(limit: number = 50, offset: number = 0): Promise<ImageData[]> {
    const snapshot = await db.collection(IMAGES_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ImageData));
  }

  // 단일 이미지 조회
  async findById(imageId: string): Promise<ImageData | null> {
    const doc = await db.collection(IMAGES_COLLECTION).doc(imageId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as ImageData;
  }

  // 이미지 업데이트
  async update(imageId: string, updateData: Partial<ImageData>): Promise<ImageData> {
    await db.collection(IMAGES_COLLECTION)
      .doc(imageId)
      .update(updateData);

    const updatedDoc = await db.collection(IMAGES_COLLECTION)
      .doc(imageId)
      .get();

    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as ImageData;
  }

  // 이미지 삭제
  async delete(imageId: string): Promise<void> {
    await db.collection(IMAGES_COLLECTION).doc(imageId).delete();
  }
}

