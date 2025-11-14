/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import Busboy from "busboy";

// Firebase Admin 초기화
// 에뮬레이터 환경 변수 확인
const useEmulator = process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.STORAGE_EMULATOR_HOST;

if (useEmulator) {
  // 에뮬레이터 사용 시 설정
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  }
  if (process.env.STORAGE_EMULATOR_HOST) {
    process.env.STORAGE_EMULATOR_HOST = "localhost:9199";
  }
}

admin.initializeApp();

// Firestore와 Storage 참조
const db = admin.firestore();
const storage = admin.storage();
// Firebase Admin SDK가 자동으로 프로젝트의 기본 Storage 버킷을 찾습니다
// 별도 설정 불필요 - Firebase Console에서 Storage 활성화만 하면 됨
const bucket = storage.bucket();

// 이미지 컬렉션 이름
const IMAGES_COLLECTION = "images";

// 이미지 인터페이스
interface ImageData {
  id?: string;
  name: string;
  description?: string;
  url: string;
  storagePath: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

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

// CORS 헤더 설정 헬퍼 함수
const setCorsHeaders = (response: {
  set: (header: string, value: string) => void;
}) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS");
  response.set("Access-Control-Allow-Headers",
    "Content-Type, Authorization");
};

// multipart/form-data 파싱 헬퍼 함수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseMultipartForm = (request: any): Promise<{
  fields: Record<string, string>;
  file: {data: Buffer; filename: string; mimetype: string} | null;
}> => {
  return new Promise((resolve, reject) => {
    // Content-Type 확인
    const contentType = request.headers["content-type"] || request.headers["Content-Type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      reject(new Error("Content-Type must be multipart/form-data"));
      return;
    }

    // eslint-disable-next-line new-cap
    const busboy = Busboy({headers: request.headers});
    const fields: Record<string, string> = {};
    let file: {data: Buffer; filename: string; mimetype: string} | null = null;

    // 타임아웃 설정 (30초)
    const timeout = setTimeout(() => {
      busboy.destroy();
      reject(new Error("Request timeout"));
    }, 30000);

    busboy.on("field", (fieldname: string, val: string) => {
      fields[fieldname] = val;
    });

    busboy.on("file", (
      fieldname: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fileStream: any,
      info: {filename: string; mimeType: string}
    ) => {
      const {filename, mimeType} = info;
      const chunks: Buffer[] = [];

      fileStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      fileStream.on("end", () => {
        file = {
          data: Buffer.concat(chunks),
          filename: filename || "image",
          mimetype: mimeType || "image/jpeg",
        };
      });

      fileStream.on("error", (error: Error) => {
        logger.error("File stream error", error);
        reject(new Error(`File stream error: ${error.message}`));
      });
    });

    busboy.on("finish", () => {
      clearTimeout(timeout);
      resolve({fields, file});
    });

    busboy.on("error", (error: Error) => {
      clearTimeout(timeout);
      logger.error("Busboy error", error);
      reject(error);
    });

    // 요청 스트림을 busboy로 파이프
    try {
      if (request.readable) {
        request.pipe(busboy);
      } else {
        // 이미 읽힌 경우 rawBody 사용
        if (request.rawBody) {
          busboy.end(request.rawBody);
        } else {
          reject(new Error("Request stream is not readable"));
        }
      }
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
};

// 이미지 생성 (Create) - 파일 업로드 포함
export const createImage = onRequest(async (request, response) => {
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
    // multipart/form-data 파싱
    const {fields, file} = await parseMultipartForm(request);

    const name = fields.name;
    const description = fields.description || "";

    if (!name) {
      response.status(400).json({
        error: "Missing required field: name",
      });
      return;
    }

    if (!file) {
      response.status(400).json({
        error: "Missing required field: file",
      });
      return;
    }

    // Storage에 파일 업로드
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.filename}`;
    const storagePath = `images/${fileName}`;
    const fileRef = bucket.file(storagePath);

    await fileRef.save(file.data, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    // 공개 URL 가져오기
    await fileRef.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Firestore에 메타데이터 저장
    const imageData: Omit<ImageData, "id"> = {
      name,
      description,
      url,
      storagePath,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await db.collection(IMAGES_COLLECTION).add(imageData);

    logger.info("Image created and uploaded", {id: docRef.id, storagePath});

    response.status(201).json({
      id: docRef.id,
      ...imageData,
    });
  } catch (error) {
    logger.error("Error creating image", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : String(error);
    logger.error("Error details", {errorMessage, errorStack});
    response.status(500).json({
      error: "Failed to create image",
      message: errorMessage,
      details: process.env.FUNCTIONS_EMULATOR ? errorStack : undefined,
    });
  }
});

// 이미지 목록 조회 (Read All)
export const getImages = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const limit = parseInt(request.query.limit as string) || 50;
    const offset = parseInt(request.query.offset as string) || 0;

    const snapshot = await db.collection(IMAGES_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    const images = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    response.status(200).json({
      images,
      total: images.length,
    });
  } catch (error) {
    logger.error("Error getting images", error);
    response.status(500).json({error: "Failed to get images"});
  }
});

// 단일 이미지 조회 (Read One)
export const getImage = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const imageId = request.path.split("/").pop();

    if (!imageId) {
      response.status(400).json({error: "Image ID is required"});
      return;
    }

    const doc = await db.collection(IMAGES_COLLECTION).doc(imageId).get();

    if (!doc.exists) {
      response.status(404).json({error: "Image not found"});
      return;
    }

    response.status(200).json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    logger.error("Error getting image", error);
    response.status(500).json({error: "Failed to get image"});
  }
});

// 이미지 업데이트 (Update)
export const updateImage = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "PUT") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const imageId = request.path.split("/").pop();

    if (!imageId) {
      response.status(400).json({error: "Image ID is required"});
      return;
    }

    const {name, description, url, storagePath} = request.body;

    const updateData: Partial<ImageData> = {
      updatedAt: Timestamp.now(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (url !== undefined) updateData.url = url;
    if (storagePath !== undefined) updateData.storagePath = storagePath;

    await db.collection(IMAGES_COLLECTION)
      .doc(imageId)
      .update(updateData);

    const updatedDoc = await db.collection(IMAGES_COLLECTION)
      .doc(imageId)
      .get();

    logger.info("Image updated", {id: imageId});

    response.status(200).json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    logger.error("Error updating image", error);
    response.status(500).json({error: "Failed to update image"});
  }
});

// 이미지 삭제 (Delete)
export const deleteImage = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "DELETE") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const imageId = request.path.split("/").pop();

    if (!imageId) {
      response.status(400).json({error: "Image ID is required"});
      return;
    }

    // Firestore에서 이미지 데이터 가져오기
    const doc = await db.collection(IMAGES_COLLECTION).doc(imageId).get();

    if (!doc.exists) {
      response.status(404).json({error: "Image not found"});
      return;
    }

    const imageData = doc.data() as ImageData;

    // Storage에서 파일 삭제
    if (imageData.storagePath) {
      try {
        const file = bucket.file(imageData.storagePath);
        await file.delete();
        logger.info("Storage file deleted", {path: imageData.storagePath});
      } catch (storageError) {
        logger.warn("Failed to delete storage file", storageError);
        // Storage 삭제 실패해도 Firestore는 삭제 진행
      }
    }

    // Firestore에서 메타데이터 삭제
    await db.collection(IMAGES_COLLECTION).doc(imageId).delete();

    logger.info("Image deleted", {id: imageId});

    response.status(200).json({
      message: "Image deleted successfully",
      id: imageId,
    });
  } catch (error) {
    logger.error("Error deleting image", error);
    response.status(500).json({error: "Failed to delete image"});
  }
});

// Swagger UI 테스트 페이지
export const apiDocs = onRequest((request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const projectId = "gdgoc-web";
  const baseUrl = process.env.FUNCTIONS_EMULATOR ?
    `http://localhost:5001/${projectId}` :
    `https://us-central1-${projectId}.cloudfunctions.net`;

  // OpenAPI 스펙 생성
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "이미지 CRUD API",
      version: "1.0.0",
      description: "Firebase Functions를 통한 이미지 CRUD API",
    },
    servers: [
      {
        url: baseUrl,
        description: "Functions 서버",
      },
    ],
    paths: {
      "/us-central1/createImage": {
        post: {
          summary: "이미지 생성 및 업로드",
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["name", "file"],
                  properties: {
                    name: {type: "string", description: "이미지 이름"},
                    description: {type: "string", description: "이미지 설명"},
                    file: {type: "string", format: "binary", description: "이미지 파일"},
                  },
                },
              },
            },
          },
          responses: {
            "201": {description: "이미지 생성 성공"},
          },
        },
      },
      "/us-central1/getImages": {
        get: {
          summary: "이미지 목록 조회",
          parameters: [
            {name: "limit", in: "query", schema: {type: "integer", default: 50}},
            {name: "offset", in: "query", schema: {type: "integer", default: 0}},
          ],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/getImage/{imageId}": {
        get: {
          summary: "단일 이미지 조회",
          parameters: [{name: "imageId", in: "path", required: true, schema: {type: "string"}}],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/updateImage/{imageId}": {
        put: {
          summary: "이미지 업데이트",
          parameters: [{name: "imageId", in: "path", required: true, schema: {type: "string"}}],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {name: {type: "string"}, description: {type: "string"}},
                },
              },
            },
          },
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/deleteImage/{imageId}": {
        delete: {
          summary: "이미지 삭제",
          parameters: [{name: "imageId", in: "path", required: true, schema: {type: "string"}}],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/getUploadUrl": {
        post: {
          summary: "업로드 URL 생성",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fileName"],
                  properties: {
                    fileName: {type: "string"},
                    contentType: {type: "string", default: "image/jpeg"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "성공"}},
        },
      },
    },
  };

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API 테스트 - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
  <style>
    body { margin: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${JSON.stringify(spec)};
      const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

  response.status(200).send(html);
});

// OpenAPI 스펙 제공
export const apiSpec = onRequest((request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const projectId = "gdgoc-web";
  const baseUrl = process.env.FUNCTIONS_EMULATOR ?
    `http://localhost:5001/${projectId}` :
    `https://us-central1-${projectId}.cloudfunctions.net`;

  const spec = {
    openapi: "3.0.0",
    info: {
      title: "이미지 CRUD API",
      version: "1.0.0",
      description: "Firebase Functions를 통한 이미지 CRUD API",
    },
    servers: [
      {
        url: baseUrl,
        description: "Functions 서버",
      },
    ],
    paths: {
      "/createImage": {
        post: {
          summary: "이미지 생성 및 업로드",
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["name", "file"],
                  properties: {
                    name: {
                      type: "string",
                      description: "이미지 이름",
                    },
                    description: {
                      type: "string",
                      description: "이미지 설명",
                    },
                    file: {
                      type: "string",
                      format: "binary",
                      description: "이미지 파일",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "이미지 생성 성공",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              },
            },
          },
        },
      },
      "/getImages": {
        get: {
          summary: "이미지 목록 조회",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: {type: "integer", default: 50},
            },
            {
              name: "offset",
              in: "query",
              schema: {type: "integer", default: 0},
            },
          ],
          responses: {
            "200": {
              description: "성공",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              },
            },
          },
        },
      },
      "/getImage/{imageId}": {
        get: {
          summary: "단일 이미지 조회",
          parameters: [
            {
              name: "imageId",
              in: "path",
              required: true,
              schema: {type: "string"},
            },
          ],
          responses: {
            "200": {
              description: "성공",
            },
          },
        },
      },
      "/updateImage/{imageId}": {
        put: {
          summary: "이미지 업데이트",
          parameters: [
            {
              name: "imageId",
              in: "path",
              required: true,
              schema: {type: "string"},
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {type: "string"},
                    description: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "성공",
            },
          },
        },
      },
      "/deleteImage/{imageId}": {
        delete: {
          summary: "이미지 삭제",
          parameters: [
            {
              name: "imageId",
              in: "path",
              required: true,
              schema: {type: "string"},
            },
          ],
          responses: {
            "200": {
              description: "성공",
            },
          },
        },
      },
      "/getUploadUrl": {
        post: {
          summary: "업로드 URL 생성",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fileName"],
                  properties: {
                    fileName: {type: "string"},
                    contentType: {type: "string", default: "image/jpeg"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "성공",
            },
          },
        },
      },
    },
  };

  response.status(200).json(spec);
});
