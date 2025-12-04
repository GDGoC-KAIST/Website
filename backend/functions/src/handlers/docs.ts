import {onRequest} from "firebase-functions/https";
import {setCorsHeaders} from "../utils/cors";

const projectId = process.env.GCLOUD_PROJECT || "website";

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
    components: {
      schemas: {
        TipTapDoc: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
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
          description: "필드 값을 삭제하려면 해당 필드에 null을 보내세요. (Send null to delete a field).",
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
          description: "필드 값을 삭제하려면 해당 필드에 null을 보내세요. (Send null to delete a field).",
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
      "/us-central1/getSeminars": {
        get: {
          summary: "세미나 목록 조회",
          parameters: [
            {name: "semester", in: "query", schema: {type: "string"}},
            {name: "type", in: "query", schema: {type: "string", enum: ["invited", "internal"]}},
            {name: "limit", in: "query", schema: {type: "integer", default: 10, maximum: 50}},
            {name: "offset", in: "query", schema: {type: "integer", default: 0}},
          ],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/getSeminar/{seminarId}": {
        get: {
          summary: "단일 세미나 조회",
          parameters: [{name: "seminarId", in: "path", required: true, schema: {type: "string"}}],
          responses: {"200": {description: "성공"}},
        },
      },
      "/us-central1/createSeminar": {
        post: {
          summary: "세미나 생성 (관리자 전용)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adminId", "title", "summary", "semester", "type", "contentMd"],
                  properties: {
                    adminId: {type: "string", description: "관리자 ID"},
                    title: {type: "string"},
                    summary: {type: "string"},
                    type: {type: "string", enum: ["invited", "internal"]},
                    semester: {type: "string", description: "YYYY-1 or YYYY-2"},
                    date: {type: "string", description: "YYYY-MM-DD"},
                    speaker: {type: "string"},
                    affiliation: {type: "string"},
                    location: {type: "string"},
                    contentMd: {type: "string", description: "Markdown content"},
                    attachmentUrls: {type: "array", items: {type: "string"}},
                    coverImageId: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {"201": {description: "세미나 생성 성공"}},
        },
      },
      "/us-central1/updateSeminar/{seminarId}": {
        put: {
          summary: "세미나 업데이트 (관리자 전용)",
          description: "필드 값을 삭제하려면 해당 필드에 null을 보내세요. (Send null to delete a field).",
          parameters: [{name: "seminarId", in: "path", required: true, schema: {type: "string"}}],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adminId"],
                  properties: {
                    adminId: {type: "string"},
                    title: {type: "string"},
                    summary: {type: "string"},
                    type: {type: "string", enum: ["invited", "internal"]},
                    semester: {type: "string"},
                    date: {type: "string"},
                    speaker: {type: "string"},
                    affiliation: {type: "string"},
                    location: {type: "string"},
                    contentMd: {type: "string"},
                    attachmentUrls: {type: "array", items: {type: "string"}},
                    coverImageId: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "세미나 업데이트 성공"}},
        },
      },
      "/us-central1/deleteSeminar/{seminarId}": {
        delete: {
          summary: "세미나 삭제 (관리자 전용)",
          parameters: [{name: "seminarId", in: "path", required: true, schema: {type: "string"}}],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adminId"],
                  properties: {
                    adminId: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "세미나 삭제 성공"}},
        },
      },
      "/us-central1/recruitApply": {
        post: {
          summary: "Recruit - Submit application",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "name",
                    "kaistEmail",
                    "googleEmail",
                    "phone",
                    "department",
                    "studentId",
                    "motivation",
                    "experience",
                    "wantsToDo",
                    "password",
                  ],
                  properties: {
                    name: {type: "string"},
                    kaistEmail: {type: "string", format: "email"},
                    googleEmail: {type: "string", format: "email"},
                    phone: {type: "string"},
                    department: {type: "string"},
                    studentId: {type: "string"},
                    motivation: {type: "string"},
                    experience: {type: "string"},
                    wantsToDo: {type: "string"},
                    githubUsername: {type: "string"},
                    portfolioUrl: {type: "string"},
                    password: {type: "string", format: "password"},
                  },
                },
              },
            },
          },
          responses: {
            "201": {description: "지원서가 접수되었습니다."},
            "409": {description: "이미 제출된 지원서"},
          },
        },
      },
      "/us-central1/recruitLogin": {
        post: {
          summary: "Recruit - Login",
          description: "10회 이상 로그인 실패 시 15분 동안 계정이 잠기며 임시 비밀번호가 이메일로 전송됩니다.",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["kaistEmail", "password"],
                  properties: {
                    kaistEmail: {type: "string", format: "email"},
                    password: {type: "string", format: "password"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {description: "로그인 성공 (세션 토큰 반환)"},
            "401": {description: "잘못된 자격 증명"},
            "423": {description: "실패 누적으로 계정 잠김"},
          },
        },
      },
      "/us-central1/recruitUpdate": {
        post: {
          summary: "Recruit - Update application",
          parameters: [
            {
              name: "Authorization",
              in: "header",
              schema: {type: "string"},
              required: true,
              description: "Bearer {sessionToken}",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {type: "string"},
                    googleEmail: {type: "string"},
                    phone: {type: "string"},
                    department: {type: "string"},
                    studentId: {type: "string"},
                    motivation: {type: "string"},
                    experience: {type: "string"},
                    wantsToDo: {type: "string"},
                    githubUsername: {type: "string"},
                    portfolioUrl: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {description: "지원서 업데이트 성공"},
            "401": {description: "세션 토큰 누락 또는 만료"},
            "403": {description: "모집 기간이 아님"},
          },
        },
      },
      "/us-central1/recruitReset": {
        post: {
          summary: "Recruit - Request password reset",
          description: "항상 성공 응답을 반환하여 이메일 존재 여부가 노출되지 않습니다.",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["kaistEmail"],
                  properties: {
                    kaistEmail: {type: "string", format: "email"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "임시 비밀번호 발급 (존재하는 경우)"}},
        },
      },
      "/us-central1/recruitConfig": {
        get: {
          summary: "Recruit - Get config",
          responses: {"200": {description: "현재 모집 설정"}},
        },
      },
      "/us-central1/recruitMe": {
        get: {
          summary: "Recruit - View my application",
          parameters: [
            {
              name: "Authorization",
              in: "header",
              required: true,
              schema: {type: "string"},
              description: "Bearer {sessionToken}",
            },
          ],
          responses: {"200": {description: "지원서 데이터"}},
        },
      },
      "/us-central1/adminGetApplications": {
        get: {
          summary: "Admin Recruit - List applications",
          parameters: [
            {name: "adminId", in: "query", required: true, schema: {type: "string"}},
            {name: "limit", in: "query", schema: {type: "integer", default: 20}},
            {name: "offset", in: "query", schema: {type: "integer", default: 0}},
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["submitted", "reviewing", "accepted", "rejected", "hold"],
              },
            },
          ],
          responses: {"200": {description: "지원서 목록 반환"}},
        },
      },
      "/us-central1/adminUpdateApplicationStatus": {
        patch: {
          summary: "Admin Recruit - Update application status",
          description: "notify=true이고 status가 accepted/rejected인 경우 이메일 전송. 템플릿에서 {{name}} 변수를 사용할 수 있습니다.",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adminId", "status", "id"],
                  properties: {
                    adminId: {type: "string"},
                    id: {type: "string", description: "Application ID (kaistEmail)"},
                    status: {
                      type: "string",
                      enum: ["submitted", "reviewing", "accepted", "rejected", "hold"],
                    },
                    notify: {type: "boolean"},
                    email: {
                      type: "object",
                      properties: {
                        subject: {type: "string"},
                        html: {type: "string"},
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {"200": {description: "상태 업데이트 성공"}},
        },
      },
      "/us-central1/adminExportApplications": {
        get: {
          summary: "Admin Recruit - Export CSV",
          parameters: [
            {name: "adminId", in: "query", required: true, schema: {type: "string"}},
          ],
          responses: {"200": {description: "CSV 파일 반환"}},
        },
      },
      "/us-central1/adminGetRecruitConfig": {
        get: {
          summary: "Admin Recruit - Get config",
          parameters: [
            {name: "adminId", in: "query", required: true, schema: {type: "string"}},
          ],
          responses: {"200": {description: "모집 설정"}},
        },
      },
      "/us-central1/adminUpdateRecruitConfig": {
        post: {
          summary: "Admin Recruit - Update config",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adminId"],
                  properties: {
                    adminId: {type: "string"},
                    isOpen: {type: "boolean"},
                    openAt: {type: "string"},
                    closeAt: {type: "string"},
                    messageWhenClosed: {type: "string"},
                    semester: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "설정 저장"}},
        },
      },
      "/us-central1/seedAdmin": {
        post: {
          summary: "초기 관리자 계정 생성 (Demo용)",
          description: "Admin 계정이 없을 때 최초 1회 호출하여 Super Admin을 생성하고 ID를 반환합니다.",
          responses: {
            "200": {
              description: "Admin account ready 또는 기존 Admin 존재 메시지",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {type: "string"},
                      adminId: {type: "string"},
                      note: {type: "string"},
                    },
                  },
                },
              },
            },
          },
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
      "/getSeminars": {
        get: {
          summary: "세미나 목록 조회",
          parameters: [
            {name: "semester", in: "query", schema: {type: "string"}},
            {name: "type", in: "query", schema: {type: "string", enum: ["invited", "internal"]}},
            {name: "limit", in: "query", schema: {type: "integer", default: 10, maximum: 50}},
            {name: "offset", in: "query", schema: {type: "integer", default: 0}},
          ],
          responses: {
            "200": {
              description: "성공",
            },
          },
        },
      },
      "/getSeminar/{seminarId}": {
        get: {
          summary: "단일 세미나 조회",
          parameters: [
            {
              name: "seminarId",
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
      "/createSeminar": {
        post: {
          summary: "세미나 생성 (관리자 전용)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adminId", "title", "summary", "semester", "type", "contentMd"],
                  properties: {
                    adminId: {
                      type: "string",
                      description: "관리자 ID",
                    },
                    title: {type: "string"},
                    summary: {type: "string"},
                    type: {
                      type: "string",
                      enum: ["invited", "internal"],
                    },
                    semester: {type: "string"},
                    date: {type: "string"},
                    speaker: {type: "string"},
                    affiliation: {type: "string"},
                    location: {type: "string"},
                    contentMd: {type: "string"},
                    attachmentUrls: {
                      type: "array",
                      items: {type: "string"},
                    },
                    coverImageId: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "세미나 생성 성공",
            },
          },
        },
      },
      "/updateSeminar/{seminarId}": {
        put: {
          summary: "세미나 업데이트 (관리자 전용)",
          parameters: [
            {
              name: "seminarId",
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
                  required: ["adminId"],
                  properties: {
                    adminId: {type: "string"},
                    title: {type: "string"},
                    summary: {type: "string"},
                    type: {
                      type: "string",
                      enum: ["invited", "internal"],
                    },
                    semester: {type: "string"},
                    date: {type: "string"},
                    speaker: {type: "string"},
                    affiliation: {type: "string"},
                    location: {type: "string"},
                    contentMd: {type: "string"},
                    attachmentUrls: {
                      type: "array",
                      items: {type: "string"},
                    },
                    coverImageId: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "세미나 업데이트 성공",
            },
          },
        },
      },
      "/deleteSeminar/{seminarId}": {
        delete: {
          summary: "세미나 삭제 (관리자 전용)",
          parameters: [
            {
              name: "seminarId",
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
                  required: ["adminId"],
                  properties: {
                    adminId: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "세미나 삭제 성공",
            },
          },
        },
      },
      "/recruitApply": {
        post: {
          summary: "Recruit - Submit application",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "name",
                    "kaistEmail",
                    "googleEmail",
                    "phone",
                    "department",
                    "studentId",
                    "motivation",
                    "experience",
                    "wantsToDo",
                    "password",
                  ],
                  properties: {
                    name: {type: "string"},
                    kaistEmail: {type: "string"},
                    googleEmail: {type: "string"},
                    phone: {type: "string"},
                    department: {type: "string"},
                    studentId: {type: "string"},
                    motivation: {type: "string"},
                    experience: {type: "string"},
                    wantsToDo: {type: "string"},
                    githubUsername: {type: "string"},
                    portfolioUrl: {type: "string"},
                    password: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "201": {description: "지원서 접수 완료"},
            "409": {description: "이미 제출된 지원서"},
          },
        },
      },
      "/recruitLogin": {
        post: {
          summary: "Recruit - Login",
          description: "10회 이상 실패 시 15분 잠금 + 임시 비밀번호 이메일 발송",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["kaistEmail", "password"],
                  properties: {
                    kaistEmail: {type: "string"},
                    password: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {description: "로그인 성공 (token 반환)"},
            "401": {description: "잘못된 자격 증명"},
            "423": {description: "계정 잠김"},
          },
        },
      },
      "/recruitUpdate": {
        post: {
          summary: "Recruit - Update application",
          parameters: [
            {
              name: "Authorization",
              in: "header",
              required: true,
              schema: {type: "string"},
              description: "Bearer {token}",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {type: "string"},
                    googleEmail: {type: "string"},
                    phone: {type: "string"},
                    department: {type: "string"},
                    studentId: {type: "string"},
                    motivation: {type: "string"},
                    experience: {type: "string"},
                    wantsToDo: {type: "string"},
                    githubUsername: {type: "string"},
                    portfolioUrl: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {description: "업데이트 성공"},
            "401": {description: "세션 불일치"},
            "403": {description: "모집 기간 아님"},
          },
        },
      },
      "/recruitReset": {
        post: {
          summary: "Recruit - Request password reset",
          description: "이메일 존재 여부와 관계없이 항상 성공 응답",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["kaistEmail"],
                  properties: {
                    kaistEmail: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {
            "200": {description: "임시 비밀번호 발급 (존재 시)"},
          },
        },
      },
      "/recruitConfig": {
        get: {
          summary: "Recruit - Get config",
          responses: {"200": {description: "현재 모집 설정"}},
        },
      },
      "/recruitMe": {
        get: {
          summary: "Recruit - View my application",
          parameters: [
            {
              name: "Authorization",
              in: "header",
              required: true,
              schema: {type: "string"},
              description: "Bearer {token}",
            },
          ],
          responses: {"200": {description: "지원서 데이터"}},
        },
      },
      "/adminGetApplications": {
        get: {
          summary: "Admin Recruit - List applications",
          parameters: [
            {name: "adminId", in: "query", required: true, schema: {type: "string"}},
            {name: "limit", in: "query", schema: {type: "integer", default: 20}},
            {name: "offset", in: "query", schema: {type: "integer", default: 0}},
            {
              name: "status",
              in: "query",
              schema: {type: "string", enum: ["submitted", "reviewing", "accepted", "rejected", "hold"]},
            },
          ],
          responses: {"200": {description: "지원서 목록 반환"}},
        },
      },
      "/adminUpdateApplicationStatus": {
        patch: {
          summary: "Admin Recruit - Update application status",
          description: "notify=true이고 status가 accepted/rejected일 때 이메일 전송 (템플릿에서 {{name}} 사용 가능)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adminId", "status", "id"],
                  properties: {
                    adminId: {type: "string"},
                    id: {type: "string"},
                    status: {type: "string", enum: ["submitted", "reviewing", "accepted", "rejected", "hold"]},
                    notify: {type: "boolean"},
                    email: {
                      type: "object",
                      properties: {
                        subject: {type: "string"},
                        html: {type: "string"},
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {"200": {description: "상태 업데이트 성공"}},
        },
      },
      "/adminExportApplications": {
        get: {
          summary: "Admin Recruit - Export CSV",
          parameters: [
            {name: "adminId", in: "query", required: true, schema: {type: "string"}},
          ],
          responses: {"200": {description: "CSV 파일 반환"}},
        },
      },
      "/adminGetRecruitConfig": {
        get: {
          summary: "Admin Recruit - Get config",
          parameters: [
            {name: "adminId", in: "query", required: true, schema: {type: "string"}},
          ],
          responses: {"200": {description: "모집 설정"}},
        },
      },
      "/adminUpdateRecruitConfig": {
        post: {
          summary: "Admin Recruit - Update config",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adminId"],
                  properties: {
                    adminId: {type: "string"},
                    isOpen: {type: "boolean"},
                    openAt: {type: "string"},
                    closeAt: {type: "string"},
                    messageWhenClosed: {type: "string"},
                    semester: {type: "string"},
                  },
                },
              },
            },
          },
          responses: {"200": {description: "설정 저장"}},
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
