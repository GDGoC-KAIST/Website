import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {MemberService} from "../services/memberService";
import {MemberRepository} from "../repositories/memberRepository";
import {setCorsHeaders} from "../utils/cors";

const memberService = new MemberService();

// HTTP 요청/응답 처리 레이어
const handleOptions = (response: any) => {
  setCorsHeaders(response);
  if (response.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
};

// 멤버 생성 (Create)
export const createMember = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {name, email, department, githubUsername} = request.body;

    if (!name || !email || !department || !githubUsername) {
      response.status(400).json({
        error: "Missing required fields: name, email, department, githubUsername",
      });
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      response.status(400).json({error: "Invalid email format"});
      return;
    }

    const memberData = await memberService.createMember(
      name,
      email,
      department,
      githubUsername
    );

    response.status(201).json(memberData);
  } catch (error) {
    logger.error("Error creating member", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : String(error);
    logger.error("Error details", {errorMessage, errorStack});
    response.status(500).json({
      error: "Failed to create member",
      message: errorMessage,
      details: process.env.FUNCTIONS_EMULATOR ? errorStack : undefined,
    });
  }
});

// 멤버 목록 조회 (Read All)
export const getMembers = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const limit = parseInt(request.query.limit as string) || 50;
    const offset = parseInt(request.query.offset as string) || 0;

    const result = await memberService.getMembers(limit, offset);

    response.status(200).json(result);
  } catch (error) {
    logger.error("Error getting members", error);
    response.status(500).json({error: "Failed to get members"});
  }
});

// 단일 멤버 조회 (Read One)
export const getMember = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const memberId = request.path.split("/").pop();

    if (!memberId) {
      response.status(400).json({error: "Member ID is required"});
      return;
    }

    const memberData = await memberService.getMember(memberId);

    response.status(200).json(memberData);
  } catch (error) {
    if (error instanceof Error && error.message === "Member not found") {
      response.status(404).json({error: "Member not found"});
      return;
    }
    logger.error("Error getting member", error);
    response.status(500).json({error: "Failed to get member"});
  }
});

// 멤버 업데이트 (Update)
export const updateMember = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "PUT") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const memberId = request.path.split("/").pop();

    if (!memberId) {
      response.status(400).json({error: "Member ID is required"});
      return;
    }

    const {name, email, department, githubUsername, isAdmin} = request.body;

    const updateData: Partial<{
      name: string;
      email: string;
      department: string;
      githubUsername: string;
      isAdmin: boolean;
    }> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        response.status(400).json({error: "Invalid email format"});
        return;
      }
      updateData.email = email;
    }
    if (department !== undefined) updateData.department = department;
    if (githubUsername !== undefined) updateData.githubUsername = githubUsername;
    if (isAdmin !== undefined) {
      // isAdmin은 boolean 타입이어야 함
      if (typeof isAdmin !== "boolean") {
        response.status(400).json({error: "isAdmin must be a boolean"});
        return;
      }
      updateData.isAdmin = isAdmin;
    }

    const updatedMember = await memberService.updateMember(memberId, updateData);

    response.status(200).json(updatedMember);
  } catch (error) {
    logger.error("Error updating member", error);
    response.status(500).json({error: "Failed to update member"});
  }
});

// 멤버 삭제 (Delete)
export const deleteMember = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "DELETE") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const memberId = request.path.split("/").pop();

    if (!memberId) {
      response.status(400).json({error: "Member ID is required"});
      return;
    }

    await memberService.deleteMember(memberId);

    response.status(200).json({
      message: "Member deleted successfully",
      id: memberId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Member not found") {
      response.status(404).json({error: "Member not found"});
      return;
    }
    logger.error("Error deleting member", error);
    response.status(500).json({error: "Failed to delete member"});
  }
});

// 관리자 목록 조회
export const getAdmins = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const memberRepo = new MemberRepository();
    const admins = await memberRepo.findAdmins();

    response.status(200).json({
      admins,
      count: admins.length,
    });
  } catch (error) {
    logger.error("Error getting admins", error);
    response.status(500).json({error: "Failed to get admins"});
  }
});

