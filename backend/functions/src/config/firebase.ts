import * as admin from "firebase-admin";
import * as path from "path";

// 환경 변수 로드 (.env 파일에서)
// 에뮬레이터 환경에서만 dotenv 사용 (프로덕션에서는 Firebase Functions가 자동으로 환경 변수 제공)
if (process.env.FUNCTIONS_EMULATOR) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require("dotenv");
    // backend/.env 경로 (컴파일된 파일 기준: lib/config/firebase.js -> backend/.env)
    // lib/config -> lib -> functions -> backend
    const envPath = path.join(__dirname, "../../.env");
    const result = dotenv.config({path: envPath});
    
    if (result.error) {
      console.warn("⚠️ .env file not found or error loading:", result.error.message);
      console.warn(`   Expected location: ${envPath} (backend/.env)`);
      console.warn("   Create .env file in backend/.env");
      console.warn("   See README.md for .env file format");
    } else {
      console.log("✅ .env file loaded successfully");
      console.log(`   Location: ${envPath}`);
      console.log("   EMAIL_USER:", process.env.EMAIL_USER ? "***set***" : "not set");
      console.log("   EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "***set***" : "not set");
      console.log("   ADMIN_EMAIL:", process.env.ADMIN_EMAIL || "not set");
    }
  } catch (error) {
    console.warn("⚠️ Failed to load dotenv:", error);
    // dotenv가 없어도 계속 진행 (환경 변수를 직접 export한 경우)
  }
}

// Firebase Admin 초기화
// 에뮬레이터 환경 변수 확인 및 설정
// Firebase Functions 에뮬레이터가 실행 중이면 자동으로 설정됨
// 하지만 명시적으로 설정하여 확실하게 함
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.STORAGE_EMULATOR_HOST;

if (isEmulator) {
  // 에뮬레이터 사용 시 환경 변수 설정 (없으면 기본값 설정)
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  }
  if (!process.env.STORAGE_EMULATOR_HOST) {
    process.env.STORAGE_EMULATOR_HOST = "localhost:9199";
  }
}

admin.initializeApp();

// Firestore와 Storage 참조
export const db = admin.firestore();
export const storage = admin.storage();
// Firebase Admin SDK가 자동으로 프로젝트의 기본 Storage 버킷을 찾습니다
export const bucket = storage.bucket();

