import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";

// 이메일 발송 유틸리티
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 이메일 발송 함수
export async function sendEmail(options: EmailOptions): Promise<void> {
  // 환경 변수에서 이메일 설정 가져오기
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const emailPort = parseInt(process.env.EMAIL_PORT || "587");

  const isEmulator = process.env.FUNCTIONS_EMULATOR;

  // 디버깅: 환경 변수 확인 (비밀번호는 마스킹)
  logger.info("Email sending attempt", {
    hasEmailUser: !!emailUser,
    emailUser: emailUser ? `${emailUser.substring(0, 3)}***` : "not set",
    hasEmailPassword: !!emailPassword,
    emailPassword: emailPassword ? "***" : "not set",
    emailHost,
    emailPort,
    isEmulator: !!isEmulator,
    to: options.to,
    subject: options.subject,
  });

  // 이메일 설정이 없으면 에러 (로컬/프로덕션 모두)
  if (!emailUser || !emailPassword) {
    if (isEmulator) {
      // 에뮬레이터 환경에서 설정이 없으면 로그만 출력
      logger.warn("Email credentials not configured. Email not sent (emulator).", {
        to: options.to,
        subject: options.subject,
        hint: "Set EMAIL_USER and EMAIL_PASSWORD in .env file to send real emails",
        envFileLocation: "backend/functions/.env",
      });
      logger.info("Email content (would be sent):", options.html);
      return;
    } else {
      // 프로덕션 환경에서는 에러 발생
      logger.warn("Email credentials not configured. Email not sent.", {
        to: options.to,
        subject: options.subject,
      });
      throw new Error(
        "Email credentials not configured. " +
        "Please set EMAIL_USER and EMAIL_PASSWORD environment variables."
      );
    }
  }

  // nodemailer transporter 생성
  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // 465 포트는 SSL 사용
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  // 이메일 발송
  try {
    logger.info("Attempting to send email via SMTP", {
      host: emailHost,
      port: emailPort,
      from: emailUser,
      to: options.to,
    });

    const info = await transporter.sendMail({
      from: `"GDGoC" <${emailUser}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
      html: options.html,
    });

    logger.info("Email sent successfully", {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error) {
    logger.error("Failed to send email", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      to: options.to,
      subject: options.subject,
      host: emailHost,
      port: emailPort,
    });
    throw error;
  }
}

// 가입 요청 알림 이메일 생성
export function createRegistrationRequestEmail(
  adminEmail: string,
  userName: string,
  userEmail: string,
  githubUsername: string,
  approveUrl: string,
  rejectUrl: string
): EmailOptions {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .user-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; text-decoration: none; border-radius: 5px; color: white; }
        .approve { background-color: #4CAF50; }
        .reject { background-color: #f44336; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>새로운 가입 요청</h1>
        </div>
        <div class="content">
          <p>새로운 사용자가 가입을 요청했습니다.</p>
          <div class="user-info">
            <p><strong>이름:</strong> ${userName}</p>
            <p><strong>이메일:</strong> ${userEmail}</p>
            <p><strong>GitHub:</strong> ${githubUsername}</p>
          </div>
          <p>아래 버튼을 클릭하여 승인 또는 거부하세요:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${approveUrl}" class="button approve">승인</a>
            <a href="${rejectUrl}" class="button reject">거부</a>
          </div>
        </div>
        <div class="footer">
          <p>이 이메일은 자동으로 발송되었습니다.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
새로운 가입 요청

이름: ${userName}
이메일: ${userEmail}
GitHub: ${githubUsername}

승인: ${approveUrl}
거부: ${rejectUrl}
  `;

  return {
    to: adminEmail,
    subject: `[GDGoC] 새로운 가입 요청: ${userName}`,
    html,
    text,
  };
}

