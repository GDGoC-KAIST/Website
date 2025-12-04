import {GalleryRepo} from "../repositories/galleryRepo";
import {AppError} from "../utils/appError";
import type {Role} from "../types/auth";
import type {Gallery, NewGallery} from "../types/schema";

export interface UserContext {
  sub: string;
  roles: Role[];
}

export interface CreateGalleryDto {
  semester: string;
  title: string;
  description?: string;
  imageIds?: string[];
}

export interface UpdateGalleryDto {
  semester?: string;
  title?: string;
  description?: string | null;
  imageIds?: string[];
}

export class GalleryService {
  private repo = new GalleryRepo();

  async createGallery(user: UserContext, body: CreateGalleryDto): Promise<Gallery> {
    this.ensureAdmin(user);
    this.validateRequiredFields(body.semester, body.title);
    const imageIds = this.normalizeImageIds(body.imageIds);
    const payload: NewGallery = {
      semester: body.semester.trim(),
      title: body.title.trim(),
      description: body.description?.trim() || undefined,
      imageIds,
    };
    return this.repo.createGallery(payload);
  }

  async updateGallery(user: UserContext, id: string, body: UpdateGalleryDto): Promise<void> {
    this.ensureAdmin(user);
    const data: Partial<Gallery> = {};
    if (body.semester !== undefined) {
      if (!body.semester.trim()) {
        throw new AppError(400, "INVALID_ARGUMENT", "semester cannot be empty");
      }
      data.semester = body.semester.trim();
    }
    if (body.title !== undefined) {
      if (!body.title.trim()) {
        throw new AppError(400, "INVALID_ARGUMENT", "title cannot be empty");
      }
      data.title = body.title.trim();
    }
    if (body.description !== undefined) {
      data.description = body.description?.trim() || "";
    }
    if (body.imageIds !== undefined) {
      data.imageIds = this.normalizeImageIds(body.imageIds);
    }

    await this.repo.updateGallery(id, data);
  }

  async listGalleries(limit?: number, cursor?: string) {
    const pageSize = limit && limit > 0 ? Math.min(limit, 50) : 20;
    return this.repo.listGalleries(pageSize, cursor);
  }

  async getGallery(id: string): Promise<Gallery> {
    const gallery = await this.repo.findById(id);
    if (!gallery) {
      throw new AppError(404, "GALLERY_NOT_FOUND", "Gallery not found");
    }
    return gallery;
  }

  async deleteGallery(user: UserContext, id: string): Promise<void> {
    this.ensureAdmin(user);
    await this.repo.deleteGallery(id);
  }

  private ensureAdmin(user: UserContext) {
    if (!user.roles.includes("ADMIN")) {
      throw new AppError(403, "FORBIDDEN", "Admin role required");
    }
  }

  private validateRequiredFields(semester?: string, title?: string) {
    if (!semester || !semester.trim()) {
      throw new AppError(400, "INVALID_ARGUMENT", "semester is required");
    }
    if (!title || !title.trim()) {
      throw new AppError(400, "INVALID_ARGUMENT", "title is required");
    }
  }

  private normalizeImageIds(imageIds?: string[]): string[] {
    if (!imageIds) return [];
    if (!Array.isArray(imageIds)) {
      throw new AppError(400, "INVALID_ARGUMENT", "imageIds must be an array");
    }
    return imageIds.map((id) => String(id).trim()).filter((id) => id.length > 0);
  }
}
