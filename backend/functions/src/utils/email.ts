import AWS from "aws-sdk";
import {env} from "../config/env";

const region = process.env.SES_REGION || "ap-northeast-2";
const isTestEnv = process.env.NODE_ENV === "test";

const ses = !isTestEnv
  ? new AWS.SES({
    apiVersion: "2010-12-01",
    region,
    credentials: new AWS.Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }),
  })
  : null;

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailPayload): Promise<void> {
  if (isTestEnv || env.disableEmailSending || !ses) {
    console.info(`[mock:sendEmail] ${subject} -> ${to}`, {
      killSwitch: env.disableEmailSending,
    });
    return;
  }

  try {
    await ses
      .sendEmail({
        Source: "noreply@gdgockaist.com",
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Charset: "UTF-8",
            Data: subject,
          },
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: html,
            },
            ...(text
              ? {
                Text: {
                  Charset: "UTF-8",
                  Data: text,
                },
              }
              : {}),
          },
        },
      })
      .promise();
  } catch (error) {
    console.error("Failed to send email via SES", error);
    throw error;
  }
}

export function createRegistrationRequestEmail(
  adminEmail: string,
  userName: string,
  userEmail: string,
  githubUsername: string,
  approveUrl: string,
  rejectUrl: string
): SendEmailPayload {
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
