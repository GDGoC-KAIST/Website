import {SeminarDoc, SeminarType} from "../types/seminar";
import {SeminarRepository} from "../repositories/seminarRepository";
import {ImageRepository} from "../repositories/imageRepository";

const SEMESTER_REGEX = /^\d{4}-[12]$/;

export class SeminarService {
  private seminarRepo: SeminarRepository;
  private imageRepo: ImageRepository;

  constructor() {
    this.seminarRepo = new SeminarRepository();
    this.imageRepo = new ImageRepository();
  }

  private validateSeminarType(type: SeminarType): void {
    if (type !== "invited" && type !== "internal") {
      throw new Error("Invalid seminar type. Must be 'invited' or 'internal'");
    }
  }

  private validateSemester(semester: string): void {
    if (!SEMESTER_REGEX.test(semester)) {
      throw new Error("Invalid semester format. Expected: YYYY-1 or YYYY-2 (e.g., 2024-2)");
    }
  }

  private async validateCoverImage(coverImageId?: string): Promise<void> {
    if (!coverImageId) return;

    const image = await this.imageRepo.findById(coverImageId);
    if (!image) {
      throw new Error("Invalid coverImageId: Image does not exist");
    }
  }

  async createSeminar(
    seminarData: Omit<SeminarDoc, "id" | "createdAt" | "updatedAt">
  ): Promise<SeminarDoc> {
    if (!seminarData.title || !seminarData.summary ||
      !seminarData.semester || !seminarData.type || !seminarData.contentMd) {
      throw new Error("Missing required fields: title, summary, semester, type, contentMd");
    }

    this.validateSeminarType(seminarData.type);
    this.validateSemester(seminarData.semester);
    await this.validateCoverImage(seminarData.coverImageId);

    const now = Date.now();
    
    // undefined 값을 제거한 세미나 데이터 생성
    const cleanSeminarData: any = {
      title: seminarData.title,
      summary: seminarData.summary,
      type: seminarData.type,
      semester: seminarData.semester,
      contentMd: seminarData.contentMd,
      createdAt: now,
      updatedAt: now,
    };

    // Optional 필드들 추가 (undefined가 아닌 경우만)
    if (seminarData.date !== undefined) cleanSeminarData.date = seminarData.date;
    if (seminarData.speaker !== undefined) cleanSeminarData.speaker = seminarData.speaker;
    if (seminarData.affiliation !== undefined) cleanSeminarData.affiliation = seminarData.affiliation;
    if (seminarData.location !== undefined) cleanSeminarData.location = seminarData.location;
    if (seminarData.attachmentUrls !== undefined) cleanSeminarData.attachmentUrls = seminarData.attachmentUrls;
    if (seminarData.coverImageId !== undefined) cleanSeminarData.coverImageId = seminarData.coverImageId;
    if (seminarData.createdBy !== undefined) cleanSeminarData.createdBy = seminarData.createdBy;
    if (seminarData.updatedBy !== undefined) cleanSeminarData.updatedBy = seminarData.updatedBy;

    const newSeminar: Omit<SeminarDoc, "id"> = cleanSeminarData;

    const id = await this.seminarRepo.create(newSeminar);

    return {
      id,
      ...newSeminar,
    };
  }

  async getSeminars(
    limit: number = 10,
    offset: number = 0,
    filters?: {
      semester?: string;
      type?: SeminarType;
    }
  ): Promise<{
    seminars: SeminarDoc[];
    total: number;
  }> {
    const seminars = await this.seminarRepo.findAll(limit, offset, filters);
    return {
      seminars,
      total: seminars.length,
    };
  }

  async getSeminar(seminarId: string): Promise<SeminarDoc> {
    const seminar = await this.seminarRepo.findById(seminarId);

    if (!seminar) {
      throw new Error("Seminar not found");
    }

    return seminar;
  }

  async updateSeminar(
    seminarId: string,
    updateData: Partial<Omit<SeminarDoc, "id" | "createdAt">>
  ): Promise<SeminarDoc> {
    const existing = await this.seminarRepo.findById(seminarId);
    if (!existing) {
      throw new Error("Seminar not found");
    }

    if (updateData.type) {
      this.validateSeminarType(updateData.type);
    }

    if (updateData.semester) {
      this.validateSemester(updateData.semester);
    }

    if (updateData.coverImageId !== undefined) {
      await this.validateCoverImage(updateData.coverImageId);
    }

    // undefined 값을 제거한 업데이트 데이터 생성
    const payload: Partial<SeminarDoc> = {
      updatedAt: Date.now(),
    };

    // undefined가 아닌 필드만 추가
    if (updateData.title !== undefined) payload.title = updateData.title;
    if (updateData.summary !== undefined) payload.summary = updateData.summary;
    if (updateData.type !== undefined) payload.type = updateData.type;
    if (updateData.semester !== undefined) payload.semester = updateData.semester;
    if (updateData.date !== undefined) payload.date = updateData.date;
    if (updateData.speaker !== undefined) payload.speaker = updateData.speaker;
    if (updateData.affiliation !== undefined) payload.affiliation = updateData.affiliation;
    if (updateData.location !== undefined) payload.location = updateData.location;
    if (updateData.contentMd !== undefined) payload.contentMd = updateData.contentMd;
    if (updateData.attachmentUrls !== undefined) payload.attachmentUrls = updateData.attachmentUrls;
    if (updateData.coverImageId !== undefined) payload.coverImageId = updateData.coverImageId;
    if (updateData.updatedBy !== undefined) payload.updatedBy = updateData.updatedBy;

    return await this.seminarRepo.update(seminarId, payload);
  }

  async deleteSeminar(seminarId: string): Promise<void> {
    const existing = await this.seminarRepo.findById(seminarId);
    if (!existing) {
      throw new Error("Seminar not found");
    }

    await this.seminarRepo.delete(seminarId);
  }
}
