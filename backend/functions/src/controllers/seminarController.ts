import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {setCorsHeaders} from "../utils/cors";
import {SeminarService} from "../services/seminarService";
import {AdminService} from "../services/adminService";
import {SeminarType} from "../types/seminar";

const seminarService = new SeminarService();
const adminService = new AdminService();

const handleOptions = (response: any): boolean => {
  setCorsHeaders(response);
  if (response.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
};

const checkAdmin = async (userId: string | undefined): Promise<void> => {
  if (!userId) {
    throw new Error("adminId is required");
  }

  const isAdmin = await adminService.isAdmin(userId);
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
};

const isBadRequestMessage = (message: string): boolean => {
  return message.startsWith("Invalid") || message.startsWith("Missing");
};

// 세미나 생성 (Admin Only)
export const createSeminar = onRequest(async (request, response) => {
  setCorsHeaders(response);
  if (handleOptions(response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {
      adminId,
      title,
      summary,
      type,
      semester,
      date,
      speaker,
      affiliation,
      location,
      contentMd,
      attachmentUrls,
      coverImageId,
    } = request.body;

    await checkAdmin(adminId);

    if (!title || !summary || !type || !semester || !contentMd) {
      response.status(400).json({
        error: "Missing required fields: title, summary, semester, type, contentMd",
      });
      return;
    }

    const seminar = await seminarService.createSeminar({
      title,
      summary,
      type,
      semester,
      date,
      speaker,
      affiliation,
      location,
      contentMd,
      attachmentUrls,
      coverImageId,
      createdBy: adminId,
      updatedBy: adminId,
    });

    response.status(201).json(seminar);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    if (error instanceof Error && isBadRequestMessage(error.message)) {
      response.status(400).json({error: error.message});
      return;
    }
    logger.error("Error creating seminar", error);
    response.status(500).json({
      error: "Failed to create seminar",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 세미나 목록 조회 (Public)
export const getSeminars = onRequest(async (request, response) => {
  setCorsHeaders(response);
  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const rawLimit = parseInt(request.query.limit as string) || 10;
    const rawOffset = parseInt(request.query.offset as string) || 0;
    const limit = Math.min(Math.max(rawLimit, 1), 50);
    const offset = Math.max(rawOffset, 0);
    const semester = request.query.semester as string | undefined;
    const type = request.query.type as SeminarType | undefined;

    if (type && type !== "invited" && type !== "internal") {
      response.status(400).json({error: "Invalid type. Must be 'invited' or 'internal'"});
      return;
    }

    const result = await seminarService.getSeminars(limit, offset, {semester, type});

    response.status(200).json(result);
  } catch (error) {
    logger.error("Error getting seminars", error);
    response.status(500).json({error: "Failed to get seminars"});
  }
});

// 단일 세미나 조회 (Public)
export const getSeminar = onRequest(async (request, response) => {
  setCorsHeaders(response);
  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const seminarId = request.path.split("/").pop();

    if (!seminarId) {
      response.status(400).json({error: "Seminar ID is required"});
      return;
    }

    const seminar = await seminarService.getSeminar(seminarId);
    response.status(200).json(seminar);
  } catch (error) {
    if (error instanceof Error && error.message === "Seminar not found") {
      response.status(404).json({error: "Seminar not found"});
      return;
    }
    logger.error("Error getting seminar", error);
    response.status(500).json({error: "Failed to get seminar"});
  }
});

// 세미나 업데이트 (Admin Only)
export const updateSeminar = onRequest(async (request, response) => {
  setCorsHeaders(response);
  if (handleOptions(response)) return;

  if (request.method !== "PUT") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const seminarId = request.path.split("/").pop();

    if (!seminarId) {
      response.status(400).json({error: "Seminar ID is required"});
      return;
    }

    const {
      adminId,
      title,
      summary,
      type,
      semester,
      date,
      speaker,
      affiliation,
      location,
      contentMd,
      attachmentUrls,
      coverImageId,
    } = request.body;

    await checkAdmin(adminId);

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (type !== undefined) updateData.type = type;
    if (semester !== undefined) updateData.semester = semester;
    if (date !== undefined) updateData.date = date;
    if (speaker !== undefined) updateData.speaker = speaker;
    if (affiliation !== undefined) updateData.affiliation = affiliation;
    if (location !== undefined) updateData.location = location;
    if (contentMd !== undefined) updateData.contentMd = contentMd;
    if (attachmentUrls !== undefined) updateData.attachmentUrls = attachmentUrls;
    if (coverImageId !== undefined) updateData.coverImageId = coverImageId;

    if (Object.keys(updateData).length === 0) {
      response.status(400).json({error: "No fields provided for update"});
      return;
    }

    updateData.updatedBy = adminId;

    const updated = await seminarService.updateSeminar(seminarId, updateData);

    response.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    if (error instanceof Error && error.message === "Seminar not found") {
      response.status(404).json({error: "Seminar not found"});
      return;
    }
    if (error instanceof Error && isBadRequestMessage(error.message)) {
      response.status(400).json({error: error.message});
      return;
    }
    logger.error("Error updating seminar", error);
    response.status(500).json({
      error: "Failed to update seminar",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 세미나 삭제 (Admin Only)
export const deleteSeminar = onRequest(async (request, response) => {
  setCorsHeaders(response);
  if (handleOptions(response)) return;

  if (request.method !== "DELETE") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const seminarId = request.path.split("/").pop();

    if (!seminarId) {
      response.status(400).json({error: "Seminar ID is required"});
      return;
    }

    const {adminId} = request.body;

    await checkAdmin(adminId);

    await seminarService.deleteSeminar(seminarId);

    response.status(200).json({
      message: "Seminar deleted successfully",
      id: seminarId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    if (error instanceof Error && error.message === "Seminar not found") {
      response.status(404).json({error: "Seminar not found"});
      return;
    }
    logger.error("Error deleting seminar", error);
    response.status(500).json({error: "Failed to delete seminar"});
  }
});
