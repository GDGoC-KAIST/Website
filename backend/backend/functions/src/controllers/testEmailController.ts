import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {sendEmail} from "../utils/email";
import {setCorsHeaders} from "../utils/cors";

// 이메일 발송 테스트 함수
export const testEmail = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {to} = request.body;

    if (!to) {
      response.status(400).json({error: "to email address is required"});
      return;
    }

    logger.info("Test email requested", {to});

    await sendEmail({
      to,
      subject: "[GDGoC] 이메일 발송 테스트",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>이메일 발송 테스트</h1>
            </div>
            <div class="content">
              <p>이 이메일은 GDGoC 백엔드 이메일 발송 기능 테스트입니다.</p>
              <p>이 메일을 받으셨다면 이메일 발송이 정상적으로 작동하는 것입니다.</p>
              <p>발송 시간: ${new Date().toLocaleString("ko-KR")}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `이메일 발송 테스트\n\n이 이메일은 GDGoC 백엔드 이메일 발송 기능 테스트입니다.\n발송 시간: ${new Date().toLocaleString("ko-KR")}`,
    });

    response.status(200).json({
      success: true,
      message: "Test email sent successfully",
      to,
    });
  } catch (error) {
    logger.error("Test email failed", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    response.status(500).json({
      error: "Failed to send test email",
      message: errorMessage,
    });
  }
});

