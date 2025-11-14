import {onRequest} from "firebase-functions/https";
import {setCorsHeaders} from "../utils/cors";

const projectId = "gdgoc-web";

// Swagger UI 테스트 페이지
export const apiDocs = onRequest((request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const baseUrl = process.env.FUNCTIONS_EMULATOR ?
    `http://localhost:5001/${projectId}` :
    `https://us-central1-${projectId}.cloudfunctions.net`;

  // OpenAPI 스펙 생성
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "GDGoC API",
      version: "1.0.0",
      description: "Firebase Functions를 통한 이미지 및 멤버 CRUD API",
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
      "/us-central1/createMember": {
        post: {
          summary: "멤버 생성",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "department", "githubUsername"],
                  properties: {
                    name: {type: "string", description: "이름"},
                    email: {type: "string", description: "이메일"},
                    department: {type: "string", description: "학과"},
                    githubUsername: {type: "string", description: "GitHub 사용자명"},
                  },
                },
              },
            },
          },
          responses: {"201": {description: "멤버 생성 성공"}},
        },
      },
      "/us-central1/getMembers": {
        get: {
          summary: "멤버 목록 조회",
          parameters: [
            {name: "limit", in: "query", schema: {type: "integer", default: 50}},
            {name: "offset", in: "query", schema: {type: "integer", default: 0}},
          ],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/getMember/{memberId}": {
        get: {
          summary: "단일 멤버 조회",
          parameters: [{name: "memberId", in: "path", required: true, schema: {type: "string"}}],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/updateMember/{memberId}": {
        put: {
          summary: "멤버 업데이트",
          parameters: [{name: "memberId", in: "path", required: true, schema: {type: "string"}}],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {type: "string"},
                    email: {type: "string"},
                    department: {type: "string"},
                    githubUsername: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/deleteMember/{memberId}": {
        delete: {
          summary: "멤버 삭제",
          parameters: [{name: "memberId", in: "path", required: true, schema: {type: "string"}}],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/loginWithGitHub": {
        post: {
          summary: "GitHub OAuth 로그인/회원가입",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["accessToken"],
                  properties: {
                    accessToken: {type: "string", description: "GitHub OAuth access token"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "로그인/회원가입 성공"}},
        },
      },
      "/us-central1/getUser": {
        get: {
          summary: "사용자 정보 조회",
          parameters: [{name: "userId", in: "query", required: true, schema: {type: "string"}}],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/checkApprovalStatus": {
        get: {
          summary: "승인 상태 확인",
          parameters: [{name: "userId", in: "query", required: true, schema: {type: "string"}}],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/getPendingUsers": {
        get: {
          summary: "승인 대기 중인 사용자 목록 (관리자 전용)",
          parameters: [
            {name: "adminId", in: "query", required: true, schema: {type: "string"}},
            {name: "limit", in: "query", schema: {type: "integer", default: 50}},
            {name: "offset", in: "query", schema: {type: "integer", default: 0}},
          ],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/approveUser": {
        post: {
          summary: "사용자 승인 (관리자 전용)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "adminId"],
                  properties: {
                    userId: {type: "string", description: "승인할 사용자 ID"},
                    adminId: {type: "string", description: "관리자 ID"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "승인 성공"}},
        },
      },
      "/us-central1/rejectUser": {
        post: {
          summary: "사용자 거부 (관리자 전용)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "adminId"],
                  properties: {
                    userId: {type: "string", description: "거부할 사용자 ID"},
                    adminId: {type: "string", description: "관리자 ID"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "거부 성공"}},
        },
      },
      "/us-central1/grantAdmin": {
        post: {
          summary: "관리자 권한 부여 (관리자 전용)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "adminId"],
                  properties: {
                    userId: {type: "string", description: "관리자 권한을 부여할 사용자 ID"},
                    adminId: {type: "string", description: "관리자 ID"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "권한 부여 성공"}},
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

  const baseUrl = process.env.FUNCTIONS_EMULATOR ?
    `http://localhost:5001/${projectId}` :
    `https://us-central1-${projectId}.cloudfunctions.net`;

  const spec = {
    openapi: "3.0.0",
    info: {
      title: "GDGoC API",
      version: "1.0.0",
      description: "Firebase Functions를 통한 이미지 및 멤버 CRUD API",
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
      "/createMember": {
        post: {
          summary: "멤버 생성",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "department", "githubUsername"],
                  properties: {
                    name: {
                      type: "string",
                      description: "이름",
                    },
                    email: {
                      type: "string",
                      description: "이메일",
                    },
                    department: {
                      type: "string",
                      description: "학과",
                    },
                    githubUsername: {
                      type: "string",
                      description: "GitHub 사용자명",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "멤버 생성 성공",
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
      "/getMembers": {
        get: {
          summary: "멤버 목록 조회",
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
      "/getMember/{memberId}": {
        get: {
          summary: "단일 멤버 조회",
          parameters: [
            {
              name: "memberId",
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
      "/updateMember/{memberId}": {
        put: {
          summary: "멤버 업데이트",
          parameters: [
            {
              name: "memberId",
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
                    email: {type: "string"},
                    department: {type: "string"},
                    githubUsername: {type: "string"},
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
      "/deleteMember/{memberId}": {
        delete: {
          summary: "멤버 삭제",
          parameters: [
            {
              name: "memberId",
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
      "/loginWithGitHub": {
        post: {
          summary: "GitHub OAuth 로그인/회원가입",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["accessToken"],
                  properties: {
                    accessToken: {
                      type: "string",
                      description: "GitHub OAuth access token",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "로그인/회원가입 성공",
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
      "/getUser": {
        get: {
          summary: "사용자 정보 조회",
          parameters: [
            {
              name: "userId",
              in: "query",
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
      "/checkApprovalStatus": {
        get: {
          summary: "승인 상태 확인",
          parameters: [
            {
              name: "userId",
              in: "query",
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
      "/getPendingUsers": {
        get: {
          summary: "승인 대기 중인 사용자 목록 (관리자 전용)",
          parameters: [
            {
              name: "adminId",
              in: "query",
              required: true,
              schema: {type: "string"},
            },
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
      "/approveUser": {
        post: {
          summary: "사용자 승인 (관리자 전용)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "adminId"],
                  properties: {
                    userId: {
                      type: "string",
                      description: "승인할 사용자 ID",
                    },
                    adminId: {
                      type: "string",
                      description: "관리자 ID",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "승인 성공",
            },
          },
        },
      },
      "/rejectUser": {
        post: {
          summary: "사용자 거부 (관리자 전용)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "adminId"],
                  properties: {
                    userId: {
                      type: "string",
                      description: "거부할 사용자 ID",
                    },
                    adminId: {
                      type: "string",
                      description: "관리자 ID",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "거부 성공",
            },
          },
        },
      },
      "/grantAdmin": {
        post: {
          summary: "관리자 권한 부여 (관리자 전용)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "adminId"],
                  properties: {
                    userId: {
                      type: "string",
                      description: "관리자 권한을 부여할 사용자 ID",
                    },
                    adminId: {
                      type: "string",
                      description: "관리자 ID",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "권한 부여 성공",
            },
          },
        },
      },
    },
  };

  response.status(200).json(spec);
});

