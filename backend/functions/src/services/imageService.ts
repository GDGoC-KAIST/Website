import type {Request} from "express";
import {Timestamp} from "firebase-admin/firestore";
import {ImageRepo, ImageFilter} from "../repositories/imageRepo";
import {deleteFile, getSignedUrl, uploadFile} from "../utils/storage";
import type {Image, ImageScope, NewImage} from "../types/schema";
import {AppError} from "../utils/appError";
import type {Role} from "../types/auth";
import {bucket} from "../config/firebase";

export interface UserContext {
  sub: string;
  roles: Role[];
}

export interface ListImageQuery {
  limit?: number;
  cursor?: string;
  uploaderUserId?: string;
}

export interface UpdateImageDto {
  name?: string;
  description?: string | null;
  scope?: ImageScope;
}

export class ImageService {
  private repo = new ImageRepo();

  async uploadImage(user: UserContext, req: Request): Promise<Image> {
    this.ensureMember(user.roles);
    const {file, fields} = await uploadFile(req, user.sub);

    const name = (fields.name || file.originalName || "image").trim();
    const description = fields.description ? fields.description.trim() : undefined;
    const scope = this.parseScope(fields.scope);
    const now = Timestamp.now();

    const imageData: NewImage = {
      name,
      description,
      storagePath: file.storagePath,
      url: this.buildCanonicalUrl(file.storagePath),
      scope,
      uploaderUserId: user.sub,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repo.createImage(imageData);
    return this.withSignedUrl(created);
  }

  async listImages(user: UserContext | undefined, query: ListImageQuery) {
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const filter: ImageFilter = {
      uploaderUserId: query.uploaderUserId,
      scopes: this.allowedScopes(user, query.uploaderUserId),
    };

    const result = await this.repo.listImages(filter, limit, query.cursor);
    const images = await Promise.all(result.images.map((image) => this.withSignedUrl(image)));
    return {images, nextCursor: result.nextCursor};
  }

  async getImage(user: UserContext | undefined, imageId: string): Promise<Image> {
    const image = await this.repo.findById(imageId);
    if (!image) {
      throw new AppError(404, "IMAGE_NOT_FOUND", "Image not found");
    }
    this.guardVisibility(image, user);
    return this.withSignedUrl(image);
  }

  async updateImage(user: UserContext, imageId: string, body: UpdateImageDto): Promise<Image> {
    const image = await this.repo.findById(imageId);
    if (!image) {
      throw new AppError(404, "IMAGE_NOT_FOUND", "Image not found");
    }
    this.guardOwner(image, user);

    const updateData: Partial<Image> = {};

    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (!trimmed) {
        throw new AppError(400, "INVALID_ARGUMENT", "Name cannot be empty");
      }
      updateData.name = trimmed;
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? body.description.trim() : "";
    }

    if (body.scope) {
      updateData.scope = this.parseScope(body.scope);
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError(400, "INVALID_ARGUMENT", "No fields to update");
    }

    await this.repo.updateImage(imageId, updateData);
    const updated = await this.repo.findById(imageId);
    if (!updated) {
      throw new AppError(404, "IMAGE_NOT_FOUND", "Image not found");
    }
    return this.withSignedUrl(updated);
  }

  async deleteImage(user: UserContext, imageId: string): Promise<void> {
    const image = await this.repo.findById(imageId);
    if (!image) {
      throw new AppError(404, "IMAGE_NOT_FOUND", "Image not found");
    }
    this.guardOwner(image, user);
    await deleteFile(image.storagePath);
    await this.repo.deleteImageDoc(imageId);
  }

  private ensureMember(roles: Role[]) {
    if (!roles.some((role) => role === "MEMBER" || role === "ADMIN")) {
      throw new AppError(403, "FORBIDDEN", "Only members can upload images");
    }
  }

  private allowedScopes(user: UserContext | undefined, uploaderFilter?: string): ImageScope[] {
    const scopes: ImageScope[] = ["public"];
    if (user && user.roles.some((role) => role === "MEMBER" || role === "ADMIN")) {
      scopes.push("members");
    }
    if (user && (user.roles.includes("ADMIN") || (uploaderFilter && uploaderFilter === user.sub))) {
      scopes.push("private");
    }
    return scopes;
  }

  private guardVisibility(image: Image, user?: UserContext) {
    if (image.scope === "public") return;
    if (!user) {
      throw new AppError(403, "FORBIDDEN", "Authentication required");
    }
    if (image.scope === "members") {
      if (!user.roles.some((role) => role === "MEMBER" || role === "ADMIN")) {
        throw new AppError(403, "FORBIDDEN", "Members only");
      }
      return;
    }
    if (image.scope === "private") {
      this.guardOwner(image, user);
    }
  }

  private guardOwner(image: Image, user: UserContext) {
    if (image.uploaderUserId !== user.sub && !user.roles.includes("ADMIN")) {
      throw new AppError(403, "FORBIDDEN", "Not allowed");
    }
  }

  private parseScope(raw?: string): ImageScope {
    const normalized = (raw || "members").toLowerCase();
    if (normalized === "public" || normalized === "members" || normalized === "private") {
      return normalized;
    }
    return "members";
  }

  private async withSignedUrl(image: Image): Promise<Image> {
    const signedUrl = await getSignedUrl(image.storagePath);
    return {...image, url: signedUrl};
  }

  private buildCanonicalUrl(storagePath: string): string {
    return `gs://${bucket.name}/${storagePath}`;
  }
}
