/**
 * Firebase Functions 엔트리 포인트
 * 모든 함수를 모듈별로 분리하여 관리
 */

import {setGlobalOptions} from "firebase-functions";

// Firebase 초기화 (가장 먼저 실행되어야 함)
import "./config/firebase";

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
} from "./controllers/memberController";

// API 문서 관련 함수들
export {apiDocs, apiSpec} from "./handlers/docs";
