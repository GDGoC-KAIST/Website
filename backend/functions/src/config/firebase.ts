import * as admin from "firebase-admin";

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

