import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {AuthService} from "../services/authService";
import {UserStatus} from "../types/user";
import {setCorsHeaders} from "../utils/cors";

const authService = new AuthService();

// HTTP 요청/응답 처리 레이어
const handleOptions = (request: any, response: any) => {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
};

// GitHub OAuth 로그인/회원가입
export const loginWithGitHub = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {accessToken, code, redirectUri} = request.body;

    // code가 있으면 accessToken으로 교환
    let finalAccessToken = accessToken;
    if (code && !accessToken) {
      // GitHub OAuth code를 accessToken으로 교환
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        logger.error("GitHub OAuth credentials not configured", {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        });
        response.status(500).json({
          error: "GitHub OAuth credentials not configured",
          message: "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in environment variables",
        });
        return;
      }

      const finalRedirectUri = redirectUri || `${request.headers.origin}/login/callback`;
      logger.info("Exchanging code for access token", {
        hasCode: !!code,
        redirectUri: finalRedirectUri,
      });

      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: finalRedirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        logger.error("Failed to exchange code for access token", {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText,
        });
        throw new Error(`Failed to exchange code for access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        logger.error("GitHub OAuth error", {
          error: tokenData.error,
          errorDescription: tokenData.error_description,
        });
        throw new Error(tokenData.error_description || tokenData.error || "GitHub OAuth error");
      }

      if (!tokenData.access_token) {
        logger.error("No access token in response", { tokenData });
        throw new Error("Failed to get access token from GitHub");
      }

      finalAccessToken = tokenData.access_token;
      logger.info("Successfully exchanged code for access token");
    }

    if (!finalAccessToken) {
      logger.error("No access token available", {
        hasCode: !!code,
        hasAccessToken: !!accessToken,
      });
      response.status(400).json({
        error: "accessToken or code is required",
        message: "Either provide accessToken or code in the request body",
      });
      return;
    }

    const result = await authService.loginWithGitHub(finalAccessToken);

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

  if (handleOptions(request, response)) return;

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

  if (handleOptions(request, response)) return;

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

// 승인된 사용자 목록 조회
export const getApprovedUsers = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(request, response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const limit = parseInt(request.query.limit as string) || 100;
    const offset = parseInt(request.query.offset as string) || 0;

    const users = await authService.getApprovedUsers(limit, offset);

    response.status(200).json({
      users,
      total: users.length,
    });
  } catch (error) {
    logger.error("Error getting approved users", error);
    response.status(500).json({error: "Failed to get approved users"});
  }
});

