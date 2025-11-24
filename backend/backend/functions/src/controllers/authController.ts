import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {AuthService} from "../services/authService";
import {UserStatus} from "../types/user";
import {setCorsHeaders} from "../utils/cors";

const authService = new AuthService();

// HTTP 요청/응답 처리 레이어
const handleOptions = (response: any) => {
  setCorsHeaders(response);
  if (response.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
};

// GitHub OAuth 로그인/회원가입
export const loginWithGitHub = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {accessToken} = request.body;

    if (!accessToken) {
      response.status(400).json({error: "accessToken is required"});
      return;
    }

    const result = await authService.loginWithGitHub(accessToken);

    // 승인 상태에 따라 메시지 결정
    let message: string;
    if (result.isNewUser) {
      message = "회원가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요.";
    } else {
      // 기존 사용자인 경우 승인 상태 확인
      switch (result.user.status) {
        case UserStatus.PENDING:
          message = "관리자 승인을 기다려주세요.";
          break;
        case UserStatus.APPROVED:
          message = "로그인 성공";
          break;
        case UserStatus.REJECTED:
          message = "가입 요청이 거부되었습니다. 관리자에게 문의하세요.";
          break;
        default:
          message = "로그인 성공";
      }
    }

    response.status(200).json({
      user: result.user,
      isNewUser: result.isNewUser,
      message,
    });
  } catch (error) {
    logger.error("Error in GitHub login", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    response.status(500).json({
      error: "Failed to login with GitHub",
      message: errorMessage,
    });
  }
});

// 사용자 정보 조회
export const getUser = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const userId = request.query.userId as string;

    if (!userId) {
      response.status(400).json({error: "userId is required"});
      return;
    }

    const user = await authService.getUser(userId);

    response.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      response.status(404).json({error: "User not found"});
      return;
    }
    logger.error("Error getting user", error);
    response.status(500).json({error: "Failed to get user"});
  }
});

// 승인 상태 확인
export const checkApprovalStatus = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const userId = request.query.userId as string;

    if (!userId) {
      response.status(400).json({error: "userId is required"});
      return;
    }

    const isApproved = await authService.isApprovedUser(userId);
    const user = await authService.getUser(userId);

    response.status(200).json({
      isApproved,
      status: user.status,
    });
  } catch (error) {
    logger.error("Error checking approval status", error);
    response.status(500).json({error: "Failed to check approval status"});
  }
});

