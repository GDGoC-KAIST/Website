import {db} from "../config/firebase";
import {PROJECTS_COLLECTION, ProjectDoc} from "../types/project";

// Firestore 데이터 접근 레이어
export class ProjectRepository {
  // 프로젝트 생성
  async create(projectData: Omit<ProjectDoc, "id">): Promise<string> {
    const docRef = await db.collection(PROJECTS_COLLECTION).add(projectData);
    return docRef.id;
  }

  // 프로젝트 목록 조회 (필터링 및 페이지네이션 지원)
  async findAll(
    limit: number = 20,
    offset: number = 0,
    filters?: {
      semester?: string;
      status?: "ongoing" | "completed";
    }
  ): Promise<ProjectDoc[]> {
    let query = db.collection(PROJECTS_COLLECTION)
      .orderBy("createdAt", "desc");

    // 동적 필터 적용
    if (filters?.semester) {
      query = query.where("semester", "==", filters.semester);
    }
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }

    // 페이지네이션
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ProjectDoc));
  }

  // 단일 프로젝트 조회
  async findById(projectId: string): Promise<ProjectDoc | null> {
    const doc = await db.collection(PROJECTS_COLLECTION).doc(projectId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as ProjectDoc;
  }

  // 프로젝트 업데이트
  async update(projectId: string, updateData: Partial<ProjectDoc>): Promise<ProjectDoc> {
    await db.collection(PROJECTS_COLLECTION)
      .doc(projectId)
      .update(updateData);

    const updatedDoc = await db.collection(PROJECTS_COLLECTION)
      .doc(projectId)
      .get();

    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as ProjectDoc;
  }

  // 프로젝트 삭제
  async delete(projectId: string): Promise<void> {
    await db.collection(PROJECTS_COLLECTION).doc(projectId).delete();
  }
}
