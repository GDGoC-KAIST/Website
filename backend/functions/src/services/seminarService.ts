import {SeminarDoc, SeminarType} from "../types/seminar";
import {SeminarRepository} from "../repositories/seminarRepository";
import {ImageRepository} from "../repositories/imageRepository";
import {stripUndefined} from "../utils/clean";
import {toFirestorePatch} from "../utils/patch";

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
    const newSeminar: Omit<SeminarDoc, "id"> = stripUndefined({
      ...seminarData,
      createdAt: now,
      updatedAt: now,
    });

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

    const payload: Partial<SeminarDoc> = {
      ...updateData,
      updatedAt: Date.now(),
    };

    const sanitizedPayload = stripUndefined(payload);
    const patchPayload = toFirestorePatch(sanitizedPayload as Record<string, unknown>);

    return await this.seminarRepo.update(
      seminarId,
      patchPayload as Partial<SeminarDoc>
    );
  }

  async deleteSeminar(seminarId: string): Promise<void> {
    const existing = await this.seminarRepo.findById(seminarId);
    if (!existing) {
      throw new Error("Seminar not found");
    }

    await this.seminarRepo.delete(seminarId);
  }
}
