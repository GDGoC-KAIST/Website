import * as crypto from "crypto";
import {db} from "../config/firebase";

// 승인 토큰 생성 및 검증
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7일

// 토큰 생성
export async function generateApprovalToken(userId: string, action: "approve" | "reject"): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + TOKEN_EXPIRY;

  // Firestore에 토큰 저장
  await db.collection("approvalTokens").doc(token).set({
    userId,
    action,
    expiresAt,
    createdAt: Date.now(),
    used: false,
  });

  return token;
}

// 토큰 검증 및 사용
export async function verifyAndUseToken(token: string): Promise<{
  userId: string;
  action: "approve" | "reject";
}> {
  const tokenDoc = await db.collection("approvalTokens").doc(token).get();

  if (!tokenDoc.exists) {
    throw new Error("Invalid token");
  }

  const tokenData = tokenDoc.data();

  if (!tokenData) {
    throw new Error("Invalid token data");
  }

  if (tokenData.used) {
    throw new Error("Token already used");
  }

  if (tokenData.expiresAt < Date.now()) {
    throw new Error("Token expired");
  }

  // 토큰 사용 처리
  await db.collection("approvalTokens").doc(token).update({
    used: true,
    usedAt: Date.now(),
  });

  return {
    userId: tokenData.userId,
    action: tokenData.action,
  };
}

