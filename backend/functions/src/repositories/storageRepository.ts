import {bucket} from "../config/firebase";
import * as logger from "firebase-functions/logger";

// Storage 데이터 접근 레이어
export class StorageRepository {
  // 파일 업로드
  async uploadFile(
    storagePath: string,
    fileData: Buffer,
    contentType: string
  ): Promise<string> {
    const fileRef = bucket.file(storagePath);

    await fileRef.save(fileData, {
      metadata: {
        contentType,
      },
    });

    // 공개 URL 가져오기
    await fileRef.makePublic();
    
    // 에뮬레이터 사용 시와 프로덕션 환경 구분
    const isEmulator = process.env.STORAGE_EMULATOR_HOST;
    const url = isEmulator ?
      `http://${process.env.STORAGE_EMULATOR_HOST}/${bucket.name}/${storagePath}` :
      `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return url;
  }

  // 파일 삭제
  async deleteFile(storagePath: string): Promise<void> {
    try {
      const file = bucket.file(storagePath);
      await file.delete();
      logger.info("Storage file deleted", {path: storagePath});
    } catch (error) {
      logger.warn("Failed to delete storage file", error);
      throw error;
    }
  }
}

