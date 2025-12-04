import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {LegacyImageService} from "../services/legacyImageService";
import {setCorsHeaders} from "../utils/cors";
import {parseMultipartForm} from "../utils/multipart";

const imageService = new LegacyImageService();

// HTTP 요청/응답 처리 레이어
const handleOptions = (request: any, response: any) => {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
};

// 이미지 생성 (Create)
export const createImage = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    // multipart/form-data 파싱
    const {fields, file} = await parseMultipartForm(request);

    const name = fields.name;
    const description = fields.description || "";

    if (!name) {
      response.status(400).json({
        error: "Missing required field: name",
      });
      return;
    }

    if (!file) {
      response.status(400).json({
        error: "Missing required field: file",
      });
      return;
    }

    // Service 호출
    const imageData = await imageService.createImage(name, description, file);

    response.status(201).json(imageData);
  } catch (error) {
    logger.error("Error creating image", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : String(error);
    logger.error("Error details", {errorMessage, errorStack});
    response.status(500).json({
      error: "Failed to create image",
      message: errorMessage,
      details: process.env.FUNCTIONS_EMULATOR ? errorStack : undefined,
    });
  }
});

// 이미지 목록 조회 (Read All)
export const getImages = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(request, response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const limit = parseInt(request.query.limit as string) || 50;
    const offset = parseInt(request.query.offset as string) || 0;

    const result = await imageService.getImages(limit, offset);

    response.status(200).json(result);
  } catch (error) {
    logger.error("Error getting images", error);
    response.status(500).json({error: "Failed to get images"});
  }
});

// 단일 이미지 조회 (Read One)
export const getImage = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(request, response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const imageId = request.path.split("/").pop();

    if (!imageId) {
      response.status(400).json({error: "Image ID is required"});
      return;
    }

    const imageData = await imageService.getImage(imageId);

    response.status(200).json(imageData);
  } catch (error) {
    if (error instanceof Error && error.message === "Image not found") {
      response.status(404).json({error: "Image not found"});
      return;
    }
    logger.error("Error getting image", error);
    response.status(500).json({error: "Failed to get image"});
  }
});

// 이미지 업데이트 (Update)
export const updateImage = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(request, response)) return;

  if (request.method !== "PUT") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const imageId = request.path.split("/").pop();

    if (!imageId) {
      response.status(400).json({error: "Image ID is required"});
      return;
    }

    const {name, description, url, storagePath} = request.body;

    const updateData: Partial<{
      name: string;
      description: string;
      url: string;
      storagePath: string;
    }> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (url !== undefined) updateData.url = url;
    if (storagePath !== undefined) updateData.storagePath = storagePath;

    const updatedImage = await imageService.updateImage(imageId, updateData);

    response.status(200).json(updatedImage);
  } catch (error) {
    logger.error("Error updating image", error);
    response.status(500).json({error: "Failed to update image"});
  }
});

// 이미지 삭제 (Delete)
export const deleteImage = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(request, response)) return;

  if (request.method !== "DELETE") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const imageId = request.path.split("/").pop();

    if (!imageId) {
      response.status(400).json({error: "Image ID is required"});
      return;
    }

    await imageService.deleteImage(imageId);

    response.status(200).json({
      message: "Image deleted successfully",
      id: imageId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Image not found") {
      response.status(404).json({error: "Image not found"});
      return;
    }
    logger.error("Error deleting image", error);
    response.status(500).json({error: "Failed to delete image"});
  }
});
