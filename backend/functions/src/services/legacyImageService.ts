import {Timestamp} from "firebase-admin/firestore";
import {ImageData} from "../types/image";
import {ImageRepository} from "../repositories/imageRepository";
import {StorageRepository} from "../repositories/storageRepository";
import * as logger from "firebase-functions/logger";
import {stripUndefined} from "../utils/clean";
import {toFirestorePatch} from "../utils/patch";

// Legacy Image service used by v1 HTTP functions
export class LegacyImageService {
  private imageRepo: ImageRepository;
  private storageRepo: StorageRepository;

  constructor() {
    this.imageRepo = new ImageRepository();
    this.storageRepo = new StorageRepository();
  }

  async createImage(
    name: string,
    description: string,
    file: {data: Buffer; filename: string; mimetype: string}
  ): Promise<ImageData> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.filename}`;
    const storagePath = `images/${fileName}`;

    const url = await this.storageRepo.uploadFile(
      storagePath,
      file.data,
      file.mimetype
    );

    const imageData: Omit<ImageData, "id"> = stripUndefined({
      name,
      description,
      url,
      storagePath,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const id = await this.imageRepo.create(imageData);

    logger.info("Image created and uploaded", {id, storagePath});

    return {
      id,
      ...imageData,
    };
  }

  async getImages(limit: number = 50, offset: number = 0): Promise<{
    images: ImageData[];
    total: number;
  }> {
    const images = await this.imageRepo.findAll(limit, offset);
    return {
      images,
      total: images.length,
    };
  }

  async getImage(imageId: string): Promise<ImageData> {
    const image = await this.imageRepo.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

    return image;
  }

  async updateImage(
    imageId: string,
    updateData: Partial<Pick<ImageData, "name" | "description" | "url" | "storagePath">>
  ): Promise<ImageData> {
    const updatePayload: Partial<ImageData> = {
      updatedAt: Timestamp.now(),
      ...updateData,
    };

    const sanitizedPayload = stripUndefined(updatePayload);
    const patchPayload = toFirestorePatch(sanitizedPayload as Record<string, unknown>);

    return await this.imageRepo.update(
      imageId,
      patchPayload as Partial<ImageData>
    );
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.imageRepo.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

    if (image.storagePath) {
      try {
        await this.storageRepo.deleteFile(image.storagePath);
      } catch (error) {
        logger.warn("Failed to delete storage file, continuing with Firestore delete", error);
      }
    }

    await this.imageRepo.delete(imageId);

    logger.info("Image deleted", {id: imageId});
  }
}
