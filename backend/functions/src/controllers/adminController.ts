import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {AdminService} from "../services/adminService";
import {setCorsHeaders} from "../utils/cors";

const adminService = new AdminService();

// HTTP 요청/응답 처리 레이어
const handleOptions = (response: any) => {
  setCorsHeaders(response);
  if (response.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
};

// 관리자 권한 확인 미들웨어
const checkAdmin = async (userId: string | undefined): Promise<void> => {
  if (!userId) {
    throw new Error("userId is required");
  }

  const isAdmin = await adminService.isAdmin(userId);
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
};

// 승인 대기 중인 사용자 목록 조회
export const getPendingUsers = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const adminId = request.query.adminId as string;
    await checkAdmin(adminId);

    const limit = parseInt(request.query.limit as string) || 50;
    const offset = parseInt(request.query.offset as string) || 0;

    const result = await adminService.getPendingUsers(limit, offset);

    response.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    logger.error("Error getting pending users", error);
    response.status(500).json({error: "Failed to get pending users"});
  }
});

// 사용자 승인
export const approveUser = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {userId, adminId} = request.body;

    if (!userId || !adminId) {
      response.status(400).json({error: "userId and adminId are required"});
      return;
    }

    await checkAdmin(adminId);

    const approvedUser = await adminService.approveUser(userId, adminId);

    response.status(200).json({
      message: "User approved successfully",
      user: approvedUser,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    logger.error("Error approving user", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    response.status(500).json({
      error: "Failed to approve user",
      message: errorMessage,
    });
  }
});

// 사용자 거부
export const rejectUser = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {userId, adminId} = request.body;

    if (!userId || !adminId) {
      response.status(400).json({error: "userId and adminId are required"});
      return;
    }

    await checkAdmin(adminId);

    const rejectedUser = await adminService.rejectUser(userId, adminId);

    response.status(200).json({
      message: "User rejected",
      user: rejectedUser,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    logger.error("Error rejecting user", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    response.status(500).json({
      error: "Failed to reject user",
      message: errorMessage,
    });
  }
});

// 관리자 권한 부여
export const grantAdmin = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {userId, adminId} = request.body;

    if (!userId || !adminId) {
      response.status(400).json({error: "userId and adminId are required"});
      return;
    }

    await checkAdmin(adminId);

    const updatedUser = await adminService.grantAdmin(userId, adminId);

    response.status(200).json({
      message: "Admin access granted",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    logger.error("Error granting admin", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    response.status(500).json({
      error: "Failed to grant admin",
      message: errorMessage,
    });
  }
});

