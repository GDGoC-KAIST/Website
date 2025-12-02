import {Timestamp} from "firebase-admin/firestore";
import {UserData, UserStatus} from "../types/user";
import {UserRepository} from "../repositories/userRepository";
import * as logger from "firebase-functions/logger";
import {sendEmail, createRegistrationRequestEmail} from "../utils/email";
import {generateApprovalToken} from "../utils/token";
import {getAdminEmails, getBaseUrl} from "../config/email";

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
      // 기존 사용자 - 프로필 정보만 업데이트 (상태는 유지)
      // 이미 APPROVED된 사용자는 바로 로그인, PENDING/REJECTED는 상태 유지
      const updated = await this.userRepo.update(user.id!, {
        githubUsername: githubUser.login,
        email: githubUser.email || user.email,
        name: githubUser.name || githubUser.login,
        profileImageUrl: githubUser.avatar_url,
        updatedAt: Timestamp.now(),
        // status는 변경하지 않음 (기존 상태 유지)
      });

      logger.info("Existing user logged in", {
        userId: user.id,
        status: updated.status,
        githubUsername: githubUser.login,
      });

      return {
        user: updated,
        isNewUser: false,
      };
    } else {
      // 신규 사용자 - 회원가입 신청
      // 특정 이메일은 자동 승인
      const autoApproveEmails = ["hbg1345@gmail.com"];
      const shouldAutoApprove = githubUser.email && autoApproveEmails.includes(githubUser.email);
      
      const newUser: Omit<UserData, "id"> = {
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        email: githubUser.email || "",
        name: githubUser.name || githubUser.login,
        profileImageUrl: githubUser.avatar_url,
        status: shouldAutoApprove ? UserStatus.APPROVED : UserStatus.PENDING,
        isAdmin: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(shouldAutoApprove && {
          approvedAt: Timestamp.now(),
          approvedBy: "system",
        }),
      };

      const id = await this.userRepo.create(newUser);

      if (shouldAutoApprove) {
        logger.info("New user auto-approved", {
          id,
          githubUsername: githubUser.login,
          email: githubUser.email,
        });
      } else {
        logger.info("New user registration request", {id, githubUsername: githubUser.login});
      }

      // 자동 승인된 사용자는 관리자 이메일 발송하지 않음
      if (!shouldAutoApprove) {
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

  // 승인된 사용자 목록 조회
  async getApprovedUsers(limit: number = 100, offset: number = 0): Promise<UserData[]> {
    return await this.userRepo.findApprovedUsers(limit, offset);
  }
}

