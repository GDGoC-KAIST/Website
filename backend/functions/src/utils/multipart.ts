import Busboy from "busboy";
import * as logger from "firebase-functions/logger";

// multipart/form-data 파싱 헬퍼 함수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseMultipartForm = (request: any): Promise<{
  fields: Record<string, string>;
  file: {data: Buffer; filename: string; mimetype: string} | null;
}> => {
  return new Promise((resolve, reject) => {
    // Content-Type 확인
    const contentType = request.headers["content-type"] ||
      request.headers["Content-Type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      reject(new Error("Content-Type must be multipart/form-data"));
      return;
    }

    // eslint-disable-next-line new-cap
    const busboy = Busboy({headers: request.headers});
    const fields: Record<string, string> = {};
    let file: {data: Buffer; filename: string; mimetype: string} | null = null;

    // 타임아웃 설정 (30초)
    const timeout = setTimeout(() => {
      busboy.destroy();
      reject(new Error("Request timeout"));
    }, 30000);

    busboy.on("field", (fieldname: string, val: string) => {
      fields[fieldname] = val;
    });

    busboy.on("file", (
      fieldname: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fileStream: any,
      info: {filename: string; mimeType: string}
    ) => {
      const {filename, mimeType} = info;
      const chunks: Buffer[] = [];

      fileStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      fileStream.on("end", () => {
        file = {
          data: Buffer.concat(chunks),
          filename: filename || "image",
          mimetype: mimeType || "image/jpeg",
        };
      });

      fileStream.on("error", (error: Error) => {
        logger.error("File stream error", error);
        reject(new Error(`File stream error: ${error.message}`));
      });
    });

    busboy.on("finish", () => {
      clearTimeout(timeout);
      resolve({fields, file});
    });

    busboy.on("error", (error: Error) => {
      clearTimeout(timeout);
      logger.error("Busboy error", error);
      reject(error);
    });

    // 요청 스트림을 busboy로 파이프
    try {
      if (request.readable) {
        request.pipe(busboy);
      } else {
        // 이미 읽힌 경우 rawBody 사용
        if (request.rawBody) {
          busboy.end(request.rawBody);
        } else {
          reject(new Error("Request stream is not readable"));
        }
      }
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
};

