import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {AdminService} from "../services/adminService";
import {verifyAndUseToken} from "../utils/token";
import {setCorsHeaders} from "../utils/cors";

const adminService = new AdminService();

// 이메일 링크를 통한 승인/거부 처리
export const handleApproval = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const token = request.query.token as string;

    if (!token) {
      response.status(400).send(`
        <html>
          <body>
            <h1>오류</h1>
            <p>토큰이 제공되지 않았습니다.</p>
          </body>
        </html>
      `);
      return;
    }

    // 토큰 검증 및 사용
    const {userId, action} = await verifyAndUseToken(token);

    if (action === "approve") {
      // 사용자 승인
      // 관리자 ID는 시스템에서 자동으로 처리 (이메일 발송자 = 관리자)
      await adminService.approveUser(userId, "system");

      response.status(200).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: #4CAF50; }
            </style>
          </head>
          <body>
            <h1 class="success">✓ 승인 완료</h1>
            <p>사용자가 성공적으로 승인되었습니다.</p>
          </body>
        </html>
      `);
    } else if (action === "reject") {
      // 사용자 거부
      await adminService.rejectUser(userId, "system");

      response.status(200).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .reject { color: #f44336; }
            </style>
          </head>
          <body>
            <h1 class="reject">✗ 거부 완료</h1>
            <p>사용자 가입 요청이 거부되었습니다.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    logger.error("Error handling approval", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    let errorHtml = "";
    if (errorMessage.includes("already used")) {
      errorHtml = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            </style>
          </head>
          <body>
            <h1>이미 처리된 요청</h1>
            <p>이 링크는 이미 사용되었습니다.</p>
          </body>
        </html>
      `;
    } else if (errorMessage.includes("expired")) {
      errorHtml = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            </style>
          </head>
          <body>
            <h1>만료된 링크</h1>
            <p>이 링크는 만료되었습니다. 관리자에게 문의하세요.</p>
          </body>
        </html>
      `;
    } else {
      errorHtml = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            </style>
          </head>
          <body>
            <h1>오류 발생</h1>
            <p>${errorMessage}</p>
          </body>
        </html>
      `;
    }

    response.status(400).send(errorHtml);
  }
});

