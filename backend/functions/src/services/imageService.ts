import {Timestamp} from "firebase-admin/firestore";
import {ImageData} from "../types/image";
import {ImageRepository} from "../repositories/imageRepository";
import {StorageRepository} from "../repositories/storageRepository";
import * as logger from "firebase-functions/logger";

// 비즈니스 로직 레이어
export class ImageService {
  private imageRepo: ImageRepository;
  private storageRepo: StorageRepository;

  constructor() {
    this.imageRepo = new ImageRepository();
    this.storageRepo = new StorageRepository();
  }

  // 이미지 생성 및 업로드
  async createImage(
    name: string,
    description: string,
    file: {data: Buffer; filename: string; mimetype: string}
  ): Promise<ImageData> {
    // Storage에 파일 업로드
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.filename}`;
    const storagePath = `images/${fileName}`;

    const url = await this.storageRepo.uploadFile(
      storagePath,
      file.data,
      file.mimetype
    );

    // Firestore에 메타데이터 저장
    const imageData: Omit<ImageData, "id"> = {
      name,
      description,
      url,
      storagePath,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const id = await this.imageRepo.create(imageData);

    logger.info("Image created and uploaded", {id, storagePath});

    return {
      id,
      ...imageData,
    };
  }

  // 이미지 목록 조회
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

  // 단일 이미지 조회
  async getImage(imageId: string): Promise<ImageData> {
    const image = await this.imageRepo.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

    return image;
  }

  // 이미지 업데이트
  async updateImage(
    imageId: string,
    updateData: Partial<Pick<ImageData, "name" | "description" | "url" | "storagePath">>
  ): Promise<ImageData> {
    const updatePayload: Partial<ImageData> = {
      updatedAt: Timestamp.now(),
      ...updateData,
    };

    return await this.imageRepo.update(imageId, updatePayload);
  }

  // 이미지 삭제
  async deleteImage(imageId: string): Promise<void> {
    // Firestore에서 이미지 데이터 가져오기
    const image = await this.imageRepo.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

    // Storage에서 파일 삭제
    if (image.storagePath) {
      try {
        await this.storageRepo.deleteFile(image.storagePath);
      } catch (error) {
        logger.warn("Failed to delete storage file, continuing with Firestore delete", error);
        // Storage 삭제 실패해도 Firestore는 삭제 진행
      }
    }

    // Firestore에서 메타데이터 삭제
    await this.imageRepo.delete(imageId);

    logger.info("Image deleted", {id: imageId});
  }
}

