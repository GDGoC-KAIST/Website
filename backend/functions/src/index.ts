/**
 * Firebase Functions 엔트리 포인트
 * 모든 함수를 모듈별로 분리하여 관리
 */

import "dotenv/config";
import "./config/env";
import {setGlobalOptions} from "firebase-functions/v2/options";
import {onRequest as onRequestV2} from "firebase-functions/v2/https";
import {
  recruitApplyHandler,
  recruitLoginHandler,
  recruitUpdateHandler,
  recruitResetHandler,
  recruitConfigHandler,
  recruitMeHandler,
} from "./controllers/recruitController";
import {
  adminGetApplicationsHandler,
  adminUpdateApplicationStatusHandler,
  adminExportApplicationsHandler,
  adminGetRecruitConfigHandler,
  adminUpdateRecruitConfigHandler,
} from "./controllers/adminRecruitController";

// Firebase 초기화 (가장 먼저 실행되어야 함)
import "./config/firebase";
import "./utils/adminBootstrap";
import {requestLogger} from "./middleware/requestLogger";
import {healthRouter} from "./routes/healthRoutes";

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// 이미지 관련 함수들 (Controller)
export {
  createImage,
  getImages,
  getImage,
  updateImage,
  deleteImage,
} from "./controllers/imageController";

// 멤버 관련 함수들 (Controller)
export {
  createMember,
  getMembers,
  getMember,
  updateMember,
  deleteMember,
  getAdmins,
} from "./controllers/memberController";

// 인증 관련 함수들 (Controller)
export {
  loginWithGitHub,
  getUser,
  checkApprovalStatus,
} from "./controllers/authController";

// 관리자 관련 함수들 (Controller)
export {
  getPendingUsers,
  approveUser,
  rejectUser,
  grantAdmin,
} from "./controllers/adminController";

// 승인 처리 관련 함수들 (Controller)
export {handleApproval} from "./controllers/approvalController";

// 프로젝트 관련 함수들 (Controller)
export {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  refreshProjectReadme,
} from "./controllers/projectController";

// 세미나 관련 함수들 (Controller)
export {
  createSeminar,
  getSeminars,
  getSeminar,
  updateSeminar,
  deleteSeminar,
} from "./controllers/seminarController";

// API 문서 관련 함수들
export {apiDocs, apiSpec} from "./handlers/docs";

// Seed/Admin bootstrap
export {seedAdmin} from "./controllers/seedController";

const recruitRequestOptions = {
  secrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "SES_REGION"],
};

export const recruitApply = onRequestV2(
  recruitRequestOptions,
  recruitApplyHandler
);

export const recruitLogin = onRequestV2(
  recruitRequestOptions,
  recruitLoginHandler
);

export const recruitUpdate = onRequestV2(
  recruitRequestOptions,
  recruitUpdateHandler
);

export const recruitReset = onRequestV2(
  recruitRequestOptions,
  recruitResetHandler
);

export const recruitConfig = onRequestV2({}, recruitConfigHandler);

export const recruitMe = onRequestV2(
  recruitRequestOptions,
  recruitMeHandler
);

export const adminGetApplications = onRequestV2(
  recruitRequestOptions,
  adminGetApplicationsHandler
);

export const adminUpdateApplicationStatus = onRequestV2(
  recruitRequestOptions,
  adminUpdateApplicationStatusHandler
);

export const adminExportApplications = onRequestV2(
  recruitRequestOptions,
  adminExportApplicationsHandler
);

export const adminGetRecruitConfig = onRequestV2(
  recruitRequestOptions,
  adminGetRecruitConfigHandler
);

export const adminUpdateRecruitConfig = onRequestV2(
  recruitRequestOptions,
  adminUpdateRecruitConfigHandler
);

// ==================== V2 API (Express-based) ====================
import express from "express";
import {v2Router} from "./routes/v2";
import {errorHandler} from "./middleware/errorHandler";
import {corsMiddleware} from "./middleware/cors";
import {telemetryMiddleware} from "./middleware/telemetry";

process.on("unhandledRejection", (reason) => {
  console.error("CRITICAL: Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("CRITICAL: Uncaught Exception:", error);
});

const app = express();

// Enable trust proxy when behind Cloud Run / Firebase Hosting / Emulator
if (process.env.K_SERVICE || process.env.FIREBASE_CONFIG || process.env.FUNCTIONS_EMULATOR === "true") {
  app.set("trust proxy", true);
} else {
  app.set("trust proxy", 1);
}

// Middleware
app.use(telemetryMiddleware);
app.use(requestLogger);
app.use(corsMiddleware);
app.use(express.json());

// Health
app.use("/healthz", healthRouter);

// V2 Routes
app.use("/v2", v2Router);

// Error handler (must be last)
app.use(errorHandler);

// Export as Firebase Function
export const apiV2 = onRequestV2(app);
