import Busboy from "busboy";
import type {Request} from "express";
import {randomUUID} from "crypto";
import {bucket} from "../config/firebase";
import {AppError} from "./appError";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface UploadedFile {
  storagePath: string;
  mimeType: string;
  size: number;
  originalName: string;
}

export interface UploadResult {
  file: UploadedFile;
  fields: Record<string, string>;
}

export async function uploadFile(req: Request, userId: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"] || req.headers["Content-Type"];
    if (typeof contentType !== "string" || !contentType.includes("multipart/form-data")) {
      reject(new AppError(400, "INVALID_FILE", "Content-Type must be multipart/form-data"));
      return;
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_FILE_SIZE,
      },
    });

    const fields: Record<string, string> = {};
    let fileHandled = false;
    let uploadPromise: Promise<void> | null = null;
    let uploadedFile: UploadedFile | null = null;

    busboy.on("field", (name: string, value: string) => {
      fields[name] = value;
    });

    busboy.on("file", (_field, fileStream, info) => {
      if (fileHandled) {
        fileStream.resume();
        reject(new AppError(400, "INVALID_FILE", "Only one file is allowed"));
        return;
      }
      fileHandled = true;
      const {filename, mimeType} = info;
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        fileStream.resume();
        reject(AppError.badRequest("Invalid file type", "INVALID_FILE_TYPE"));
        return;
      }

      const extension = resolveExtension(filename, mimeType);
      const storagePath = `images/${userId}/${randomUUID()}${extension}`;
      const chunks: Buffer[] = [];
      let size = 0;
      let tooLarge = false;

      uploadPromise = new Promise((resolveUpload, rejectUpload) => {
        fileStream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_FILE_SIZE) {
            tooLarge = true;
            fileStream.resume();
          } else {
            chunks.push(chunk);
          }
        });

        const rejectTooLarge = () => {
          tooLarge = true;
          fileStream.resume();
          rejectUpload(AppError.payloadTooLarge("File too large (max 5MB)"));
        };

        fileStream.on("limit", rejectTooLarge);

        fileStream.on("end", async () => {
          if (tooLarge) return;
          try {
            const buffer = Buffer.concat(chunks);
            const bucketFile = bucket.file(storagePath);
            await bucketFile.save(buffer, {contentType: mimeType, resumable: false});
            uploadedFile = {
              storagePath,
              mimeType,
              size,
              originalName: filename || "upload",
            };
            resolveUpload();
          } catch (error) {
            rejectUpload(error instanceof AppError ? error : new AppError(500, "UPLOAD_FAILED", "Failed to upload file"));
          }
        });

        const onStreamError = (error: unknown) => {
          rejectUpload(error instanceof AppError ? error : new AppError(500, "UPLOAD_FAILED", "Failed to upload file"));
        };

        fileStream.on("error", onStreamError);
      });
    });

    busboy.on("filesLimit", () => {
      reject(new AppError(400, "INVALID_FILE", "Too many files provided"));
    });

    busboy.on("partsLimit", () => {
      reject(new AppError(400, "INVALID_FILE", "Too many form parts"));
    });

    busboy.on("finish", async () => {
      try {
        if (!uploadPromise) {
          throw new AppError(400, "INVALID_FILE", "File field is required");
        }
        await uploadPromise;
        if (!uploadedFile) {
          throw new AppError(500, "UPLOAD_FAILED", "Failed to upload file");
        }
        resolve({file: uploadedFile, fields});
      } catch (error) {
        reject(error);
      }
    });

    busboy.on("error", (error) => {
      reject(error);
    });

    req.pipe(busboy);
  });
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  // Emulator cannot issue real signed URLs; return direct emulator URL instead.
  if (process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    const host = process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST || "localhost:9199";
    const encodedPath = encodeURIComponent(storagePath);
    return `http://${host}/storage/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
  }

  const [url] = await bucket.file(storagePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 3600 * 1000, // 1 hour
  });
  return url;
}

export async function deleteFile(storagePath: string): Promise<void> {
  await bucket.file(storagePath).delete({ignoreNotFound: true});
}

function resolveExtension(filename: string | undefined, mimeType: string): string {
  if (filename) {
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex !== -1) {
      return filename.slice(dotIndex).toLowerCase();
    }
  }
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}
