import {MemberRepository} from "../repositories/memberRepository";
import * as logger from "firebase-functions/logger";

// 관리자 이메일 목록 가져오기
// 우선순위: 1. 환경 변수 ADMIN_EMAIL 2. 멤버 컬렉션의 isAdmin=true 멤버들
export async function getAdminEmails(): Promise<string[]> {
  logger.info("Getting admin emails...");

  // 환경 변수에 관리자 이메일이 설정되어 있으면 우선 사용
  const envAdminEmail = process.env.ADMIN_EMAIL;
  logger.info("Checking ADMIN_EMAIL environment variable", {
    hasAdminEmail: !!envAdminEmail,
    adminEmail: envAdminEmail ? `${envAdminEmail.substring(0, 10)}***` : "not set",
  });

  if (envAdminEmail) {
    // 쉼표로 구분된 여러 이메일 지원
    const emails = envAdminEmail
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
    
    if (emails.length > 0) {
      logger.info("✅ Using admin emails from environment variable", {
        emails,
        count: emails.length,
        source: "ADMIN_EMAIL env var",
      });
      return emails;
    } else {
      logger.warn("ADMIN_EMAIL is set but no valid emails found after parsing");
    }
  }

  // 환경 변수가 없으면 멤버 컬렉션에서 관리자 이메일 가져오기
  logger.info("Checking members collection for admin emails...");
  try {
    const memberRepo = new MemberRepository();
    const admins = await memberRepo.findAdmins();
    
    logger.info("Found admin members", {
      adminCount: admins.length,
      admins: admins.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email ? `${a.email.substring(0, 5)}***` : "no email",
        isAdmin: a.isAdmin,
      })),
    });

    const emails = admins.map((admin) => admin.email).filter((email) => email);

    if (emails.length > 0) {
      logger.info("✅ Using admin emails from members collection", {
        emails,
        count: emails.length,
        source: "members collection (isAdmin=true)",
      });
      return emails;
    } else {
      logger.warn("Admin members found but no emails available", {
        adminCount: admins.length,
      });
    }
  } catch (error) {
    logger.error("❌ Error getting admin emails from members", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  // 둘 다 없으면 기본값 사용
  const fallbackEmail = "admin@gdgoc.kaist.ac.kr";
  logger.warn("⚠️ No admin emails found, using fallback email", {
    fallbackEmail,
    sources: ["ADMIN_EMAIL env var", "members collection"],
  });
  return [fallbackEmail];
}

// 이메일 발송 기본 URL (프론트엔드 또는 백엔드)
export const getBaseUrl = (): string => {
  const projectId = process.env.GCLOUD_PROJECT || "website";
  if (process.env.FUNCTIONS_EMULATOR) {
    return `http://localhost:5001/${projectId}/us-central1`;
  }
  return `https://us-central1-${projectId}.cloudfunctions.net`;
};

