import {Timestamp} from "firebase-admin/firestore";
import {UserData, UserStatus} from "../types/user";
import {UserRepository, UserRepo, type GitHubProfile, type User as UserDocument} from "../repositories/userRepository";
import * as logger from "firebase-functions/logger";
import {sendEmail, createRegistrationRequestEmail} from "../utils/email";
import {generateApprovalToken} from "../utils/token";
import {getAdminEmails, getBaseUrl} from "../config/email";
import {AppError} from "../utils/appError";
import {SessionRepo} from "../repositories/sessionRepo";
import {createSessionPayload, generateAccessToken, generateRefreshToken} from "./tokenService";
import {generateRandomToken, hashToken} from "../utils/hash";

// GitHub OAuth 토큰으로 사용자 정보 가져오기
async function fetchGitHubUser(accessToken: string): Promise<{
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
}> {
  // 기본 사용자 정보 가져오기
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      "Authorization": `token ${accessToken}`,
      "User-Agent": "GDGoC-Website",
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch GitHub user");
  }

  const userData = await userResponse.json();

  // 이메일이 없으면 /user/emails 엔드포인트에서 가져오기 시도
  let email = userData.email || "";
  
  if (!email) {
    try {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          "Authorization": `token ${accessToken}`,
          "User-Agent": "GDGoC-Website",
          "Accept": "application/vnd.github.v3+json",
        },
      });

      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        // primary 이메일 찾기
        const primaryEmail = emails.find((e: any) => e.primary);
        if (primaryEmail) {
          email = primaryEmail.email;
        } else if (emails.length > 0) {
          // primary가 없으면 첫 번째 이메일 사용
          email = emails[0].email;
        }
      }
    } catch (error) {
      logger.warn("Failed to fetch GitHub user emails", error);
      // 이메일을 가져오지 못해도 계속 진행
    }
  }

  return {
    id: userData.id,
    login: userData.login,
    email: email,
    name: userData.name || userData.login,
    avatar_url: userData.avatar_url,
  };
}

// 비즈니스 로직 레이어
export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  // GitHub OAuth 로그인/회원가입
  async loginWithGitHub(accessToken: string): Promise<{
    user: UserData;
    isNewUser: boolean;
  }> {
    // GitHub에서 사용자 정보 가져오기
    const githubUser = await fetchGitHubUser(accessToken);

    // 기존 사용자 확인
    let user = await this.userRepo.findByGithubId(String(githubUser.id));

    if (user) {
      // 기존 사용자 - 프로필 정보 업데이트
      const updated = await this.userRepo.update(user.id!, {
        githubUsername: githubUser.login,
        email: githubUser.email || user.email,
        name: githubUser.name || githubUser.login,
        profileImageUrl: githubUser.avatar_url,
        updatedAt: Timestamp.now(),
      });

      return {
        user: updated,
        isNewUser: false,
      };
    } else {
      // 신규 사용자 - 회원가입 신청 (pending 상태)
      const newUser: Omit<UserData, "id"> = {
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        email: githubUser.email || "",
        name: githubUser.name || githubUser.login,
        profileImageUrl: githubUser.avatar_url,
        status: UserStatus.PENDING,
        isAdmin: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const id = await this.userRepo.create(newUser);

      logger.info("New user registration request", {id, githubUsername: githubUser.login});

      // 관리자들에게 이메일 발송
      // 사용자 이메일이 없어도 관리자에게는 이메일 발송 (관리자 이메일은 있으므로)
      try {
        const approveToken = await generateApprovalToken(id, "approve");
        const rejectToken = await generateApprovalToken(id, "reject");
        const baseUrl = getBaseUrl();

        const approveUrl = `${baseUrl}/handleApproval?token=${approveToken}`;
        const rejectUrl = `${baseUrl}/handleApproval?token=${rejectToken}`;

        // 멤버 컬렉션에서 관리자 이메일 목록 가져오기
        const adminEmails = await getAdminEmails();

        logger.info("Sending registration request emails to admins", {
          adminEmails,
          count: adminEmails.length,
          userEmail: newUser.email || "not provided",
        });

        // 모든 관리자에게 이메일 발송
        const emailPromises = adminEmails.map((adminEmail) => {
          const emailOptions = createRegistrationRequestEmail(
            adminEmail,
            newUser.name,
            newUser.email || "이메일 없음",
            newUser.githubUsername,
            approveUrl,
            rejectUrl
          );
          return sendEmail(emailOptions);
        });

        await Promise.all(emailPromises);
        logger.info("Registration request emails sent to admins successfully", {
          adminEmails,
          count: adminEmails.length,
        });
      } catch (error) {
        logger.error("Failed to send registration email", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        // 이메일 발송 실패해도 사용자 생성은 성공으로 처리
      }

      return {
        user: {
          id,
          ...newUser,
        },
        isNewUser: true,
      };
    }
  }

  // 사용자 정보 조회
  async getUser(userId: string): Promise<UserData> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // 승인된 사용자 확인
  async isApprovedUser(userId: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    return user?.status === UserStatus.APPROVED || false;
  }
}

const GITHUB_PROFILE_ENDPOINT = "https://api.github.com/user";
const GITHUB_EMAIL_ENDPOINT = "https://api.github.com/user/emails";

interface LoginContext {
  ip?: string;
  userAgent?: string;
}

const REFRESH_TOKEN_DELIMITER = ".";

class RefreshReuseDetectedError extends Error {
  constructor(public readonly userId: string) {
    super("REFRESH_REUSE_DETECTED");
    this.name = "RefreshReuseDetectedError";
  }
}

function composeRefreshToken(sessionId: string, secret: string): string {
  return `${sessionId}${REFRESH_TOKEN_DELIMITER}${secret}`;
}

function extractSessionId(refreshToken: string): string {
  const [sessionId, secret] = refreshToken.split(REFRESH_TOKEN_DELIMITER);
  if (!sessionId || !secret) {
    throw new AppError(400, "INVALID_REFRESH_TOKEN", "Refresh token is malformed");
  }
  return sessionId;
}

export class AuthV2Service {
  private userRepo = new UserRepo();
  private sessionRepo = new SessionRepo();

  async loginWithGitHub(githubAccessToken: string, context: LoginContext = {}): Promise<{
    user: UserDocument;
    accessToken: string;
    refreshToken: string;
  }> {
    if (!githubAccessToken) {
      throw new AppError(400, "INVALID_REQUEST", "githubAccessToken is required");
    }

    const githubProfile = await fetchGitHubProfile(githubAccessToken);
    const user = await this.userRepo.upsertUser(githubProfile);

    const sessionId = generateRandomToken(32);
    const refreshToken = composeRefreshToken(sessionId, generateRefreshToken());
    const session = createSessionPayload({
      userId: user.id,
      refreshToken,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await this.sessionRepo.createSession(sessionId, session);

    const accessToken = generateAccessToken({
      sub: user.id,
      roles: user.roles,
      memberId: user.memberId,
      sid: sessionId,
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshSession(refreshToken: string, context: LoginContext = {}): Promise<{accessToken: string; refreshToken: string}> {
    if (!refreshToken) {
      throw new AppError(400, "INVALID_ARGUMENT", "refreshToken is required");
    }

    const sessionId = extractSessionId(refreshToken);
    const incomingHash = hashToken(refreshToken);

    let rotationResult: {userId: string; sessionId: string; refreshToken: string};
    try {
      rotationResult = await this.sessionRepo.runTransaction(async (tx) => {
        const session = await this.sessionRepo.findById(sessionId, tx);
        if (!session) {
          throw new AppError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid");
        }
        if (session.refreshTokenHash !== incomingHash) {
          throw new AppError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid");
        }
        if (session.revokedAt || session.rotatedAt) {
          throw new RefreshReuseDetectedError(session.userId);
        }
        if (session.expiresAt.toMillis() <= Date.now()) {
          throw new AppError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
        }

        const nextSessionId = generateRandomToken(32);
        const nextRefreshToken = composeRefreshToken(nextSessionId, generateRefreshToken());
        const newSessionPayload = createSessionPayload({
          userId: session.userId,
          refreshToken: nextRefreshToken,
          ip: context.ip,
          userAgent: context.userAgent,
        });

        const rotationTime = Timestamp.now();
        this.sessionRepo.createSessionTx(tx, nextSessionId, newSessionPayload);
        tx.update(this.sessionRepo.doc(session.id), {
          rotatedAt: rotationTime,
          replacedBy: nextSessionId,
        });

        return {
          userId: session.userId,
          sessionId: nextSessionId,
          refreshToken: nextRefreshToken,
        };
      });
    } catch (error) {
      if (error instanceof RefreshReuseDetectedError) {
        await this.sessionRepo.revokeAllSessions(error.userId);
        throw new AppError(401, "REFRESH_REUSE_DETECTED", "Refresh token reuse detected");
      }
      throw error;
    }

    const user = await this.userRepo.findById(rotationResult.userId);
    const roles = user?.roles ?? ["USER"];
    const memberId = user?.memberId;

    const finalAccessToken = generateAccessToken({
      sub: rotationResult.userId,
      roles,
      memberId,
      sid: rotationResult.sessionId,
    });

    return {
      accessToken: finalAccessToken,
      refreshToken: rotationResult.refreshToken,
    };
  }
}

async function fetchGitHubProfile(accessToken: string): Promise<GitHubProfile> {
  const response = await fetch(GITHUB_PROFILE_ENDPOINT, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new AppError(response.status, "GITHUB_USER_FETCH_FAILED", "Failed to fetch GitHub profile");
  }

  const data = await response.json() as GitHubProfile & {email?: string | null; avatar_url?: string | null;};
  let email = data.email ?? undefined;

  if (!email) {
    const verifiedEmail = await fetchVerifiedGithubEmail(accessToken);
    if (!verifiedEmail) {
      throw new AppError(403, "GITHUB_NO_VERIFIED_EMAIL", "GitHub account has no verified email");
    }
    email = verifiedEmail;
  }

  return {
    id: data.id,
    login: data.login,
    name: data.name ?? data.login,
    email,
    avatar_url: data.avatar_url,
  };
}

async function fetchVerifiedGithubEmail(accessToken: string): Promise<string | null> {
  const response = await fetch(GITHUB_EMAIL_ENDPOINT, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const emails = await response.json() as Array<{
    email: string;
    primary: boolean;
    verified: boolean;
  }>;

  const primary = emails.find((entry) => entry.primary && entry.verified);
  if (primary) {
    return primary.email;
  }

  return null;
}
