import path from "path";
import type {Options} from "swagger-jsdoc";

const docsDir = typeof __dirname !== "undefined" ? __dirname : path.resolve(process.cwd(), "src/docs");

export const openApiOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GDGoC KAIST API",
      version: "2.0.0",
      description: "RESTful API for GDGoC KAIST website - V2 endpoints with JWT authentication, TipTap content, and Firebase integration",
      contact: {
        name: "GDGoC KAIST",
        url: "https://gdgockaist.com",
      },
    },
    servers: [
      {
        url: "http://127.0.0.1:5001/demo-test/us-central1/apiV2",
        description: "Local Development (Firebase Emulator)",
      },
      {
        url: "https://your-project.cloudfunctions.net/apiV2",
        description: "Production (Replace with actual Firebase Functions URL)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token obtained from /v2/auth/login/github",
        },
        recruitSession: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "RecruitSession",
          description: "Opaque session token returned by /v2/recruit/login. 세션은 14일 후 만료될 수 있음 (Legacy 세션은 유지됨).",
        },
      },
      schemas: {
        // ===== CRITICAL: TipTap Schema =====
        // MUST be defined here to resolve $ref pointers in Post.content
        TipTapDoc: {
          type: "object",
          additionalProperties: true,
          description: "TipTap editor JSON structure - flexible schema for rich text content",
          example: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Hello World",
                  },
                ],
              },
            ],
          },
        },
        // ===== Common Schemas =====
        ErrorCode: {
          type: "string",
          enum: [
            "VALIDATION_ERROR",
            "INVALID_INPUT",
            "UNAUTHORIZED",
            "TOKEN_EXPIRED",
            "REFRESH_TOKEN_REUSED",
            "FORBIDDEN",
            "INSUFFICIENT_ROLE",
            "NOT_FOUND",
            "ALREADY_EXISTS",
            "CONFLICT",
            "TOO_MANY_REQUESTS",
            "INTERNAL_ERROR",
            "FILE_TOO_LARGE",
            "INVALID_FILE_TYPE",
            "PAYLOAD_TOO_LARGE",
          ],
        },
        ErrorDetail: {
          type: "object",
          required: ["source", "issues"],
          properties: {
            source: {
              type: "string",
              description: "Which part of the request failed validation",
              enum: ["body", "query", "params", "system"],
            },
            issues: {
              type: "array",
              items: {
                type: "object",
                required: ["path", "message"],
                properties: {
                  path: {type: "string", example: "body.linkCode"},
                  message: {type: "string", example: "linkCode is required"},
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: {$ref: "#/components/schemas/ErrorCode"},
                message: {type: "string", example: "Authentication required"},
                details: {
                  type: "array",
                  nullable: true,
                  description: "Optional contextual information or validation details",
                  items: {$ref: "#/components/schemas/ErrorDetail"},
                },
              },
            },
          },
        },
        ValidationErrorResponse: {
          allOf: [
            {$ref: "#/components/schemas/ErrorResponse"},
            {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: {enum: ["VALIDATION_ERROR"], default: "VALIDATION_ERROR"},
                    details: {
                      items: {$ref: "#/components/schemas/ErrorDetail"},
                    },
                  },
                },
              },
            },
          ],
        },
        Error: {
          allOf: [
            {$ref: "#/components/schemas/ErrorResponse"},
          ],
        },
        Pagination: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 20,
              description: "Number of items per page",
            },
            page: {
              type: "integer",
              minimum: 1,
              description: "Current page number (1-indexed)",
            },
            cursor: {
              type: "string",
              nullable: true,
              description: "Cursor for pagination (opaque string)",
            },
          },
        },
        CursorPagination: {
          type: "object",
          properties: {
            nextCursor: {
              type: "string",
              nullable: true,
              description: "Cursor for next page, null if no more pages",
            },
          },
        },
        HealthCheckDependencies: {
          type: "object",
          description: "Reported when deep=1",
          properties: {
            firestore: {type: "string", enum: ["up", "down"], example: "up"},
            storage: {type: "string", enum: ["up", "down"], example: "up"},
            redis: {type: "string", enum: ["up", "down", "skipped"], example: "skipped"},
          },
        },
        HealthCheckResponse: {
          type: "object",
          required: ["ok", "service", "ts"],
          properties: {
            ok: {type: "boolean", example: true},
            service: {type: "string", example: "functions"},
            ts: {type: "string", format: "date-time", example: "2024-01-01T00:00:00.000Z"},
            dependencies: {$ref: "#/components/schemas/HealthCheckDependencies"},
          },
        },
        HealthCheckFailureResponse: {
          type: "object",
          required: ["ok", "error"],
          properties: {
            ok: {type: "boolean", example: false},
            error: {type: "string", example: "Dependency Failure"},
            dependencies: {$ref: "#/components/schemas/HealthCheckDependencies"},
          },
        },
        UserUpdateRequest: {
          type: "object",
          properties: {
            name: {type: "string", example: "홍길동"},
            phone: {type: "string", example: "010-1234-5678"},
            department: {type: "string", example: "Computer Science"},
            studentId: {type: "string", example: "20240001"},
            profileImage: {type: "string", nullable: true, example: "https://example.com/profile.png"},
          },
          additionalProperties: false,
        },
        // ===== User Schemas =====
        User: {
          type: "object",
          required: ["id", "githubId", "githubUsername", "roles", "createdAt"],
          properties: {
            id: {type: "string", example: "1001"},
            githubId: {type: "string", example: "1001"},
            githubUsername: {type: "string", example: "testuser"},
            email: {type: "string", format: "email", example: "user@example.com"},
            name: {type: "string", example: "Test User"},
            githubProfileImageUrl: {
              type: "string",
              format: "uri",
              example: "https://avatars.githubusercontent.com/u/1001",
            },
            profileImageUrl: {type: "string", format: "uri"},
            memberId: {type: "string", nullable: true, example: "member123"},
            roles: {
              type: "array",
              items: {type: "string", enum: ["USER", "MEMBER", "ADMIN"]},
              example: ["USER", "MEMBER"],
            },
            bio: {type: "string", example: "Software engineer"},
            stacks: {
              type: "array",
              items: {type: "string"},
              example: ["React", "TypeScript"],
            },
            createdAt: {type: "string", format: "date-time"},
            updatedAt: {type: "string", format: "date-time"},
            lastLoginAt: {type: "string", format: "date-time", nullable: true},
          },
        },
        // ===== Post Schemas =====
        Post: {
          type: "object",
          required: ["id", "type", "title", "content", "authorUserId", "visibility", "createdAt", "updatedAt"],
          properties: {
            id: {type: "string", example: "post123"},
            type: {type: "string", enum: ["blog", "notice"], example: "blog"},
            title: {type: "string", example: "My First Post"},
            content: {
              $ref: "#/components/schemas/TipTapDoc",
            },
            excerpt: {type: "string", example: "A brief summary..."},
            plainText: {type: "string", example: "Plain text version"},
            readingTime: {type: "integer", example: 5, description: "Estimated reading time in minutes"},
            thumbnailUrl: {type: "string", format: "uri"},
            tags: {
              type: "array",
              items: {type: "string"},
              example: ["tutorial", "typescript"],
            },
            visibility: {
              type: "string",
              enum: ["public", "members_only", "private"],
              example: "public",
            },
            authorUserId: {type: "string", example: "user123"},
            authorMemberId: {type: "string", example: "member123"},
            viewCount: {type: "integer", example: 42},
            likeCount: {type: "integer", example: 5},
            commentCount: {type: "integer", example: 3},
            isDeleted: {type: "boolean", example: false},
            createdAt: {type: "string", format: "date-time"},
            updatedAt: {type: "string", format: "date-time"},
          },
        },
        // ===== Comment Schemas =====
        Comment: {
          type: "object",
          required: ["id", "targetType", "targetId", "writerUserId", "content", "createdAt"],
          properties: {
            id: {type: "string", example: "comment123"},
            targetType: {type: "string", enum: ["post", "project", "seminar"], example: "post"},
            targetId: {type: "string", example: "post123"},
            writerUserId: {type: "string", example: "user123"},
            content: {type: "string", example: "Great post!"},
            parentId: {type: "string", nullable: true, example: null},
            isDeleted: {type: "boolean", example: false},
            createdAt: {type: "string", format: "date-time"},
            updatedAt: {type: "string", format: "date-time"},
          },
        },
        // ===== Like Schemas =====
        LikeToggleResult: {
          type: "object",
          required: ["liked", "likeCount"],
          properties: {
            liked: {
              type: "boolean",
              description: "Indicates whether the authenticated user now likes the target",
              example: true,
            },
            likeCount: {
              type: "integer",
              description: "Updated aggregate like count for the target entity",
              example: 123,
            },
          },
        },
        // ===== Image Schemas =====
        Image: {
          type: "object",
          required: ["id", "url", "uploaderUserId", "scope", "createdAt"],
          properties: {
            id: {type: "string", example: "img123"},
            url: {type: "string", format: "uri", example: "https://storage.googleapis.com/..."},
            storagePath: {type: "string", example: "images/user123/uuid.jpg"},
            name: {type: "string", example: "My Image"},
            description: {type: "string", example: "A beautiful sunset"},
            uploaderUserId: {type: "string", example: "user123"},
            scope: {type: "string", enum: ["public", "members", "private"], example: "public"},
            createdAt: {type: "string", format: "date-time"},
            updatedAt: {type: "string", format: "date-time"},
          },
        },
        // ===== Gallery Schemas =====
        Gallery: {
          type: "object",
          required: ["id", "semester", "title", "imageIds", "createdAt"],
          properties: {
            id: {type: "string", example: "gallery123"},
            semester: {type: "string", example: "2024-1"},
            title: {type: "string", example: "Spring 2024 Gallery"},
            description: {type: "string", example: "Photos from our spring events"},
            imageIds: {
              type: "array",
              items: {type: "string"},
              example: ["img1", "img2", "img3"],
            },
            createdAt: {type: "string", format: "date-time"},
            updatedAt: {type: "string", format: "date-time"},
          },
        },
        RecruitApplicationRequest: {
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
            name: {type: "string", example: "Jane Doe"},
            kaistEmail: {type: "string", format: "email", example: "jane@kaist.ac.kr"},
            googleEmail: {type: "string", format: "email", example: "jane@gmail.com"},
            phone: {type: "string", example: "+82-10-1234-5678"},
            department: {type: "string", example: "Computer Science"},
            studentId: {type: "string", example: "20240000"},
            motivation: {type: "string", example: "I love building products."},
            experience: {type: "string", example: "Hackathons, internships"},
            wantsToDo: {type: "string", example: "Backend development"},
            githubUsername: {type: "string", example: "jane-dev"},
            portfolioUrl: {type: "string", format: "uri"},
            password: {type: "string", format: "password", example: "securePass123!"},
          },
        },
        RecruitLoginRequest: {
          type: "object",
          required: ["kaistEmail", "password"],
          properties: {
            kaistEmail: {type: "string", format: "email"},
            password: {type: "string", format: "password"},
          },
        },
        RecruitSessionResponse: {
          type: "object",
          required: ["success", "token"],
          properties: {
            success: {type: "boolean", example: true},
            token: {type: "string", description: "Opaque session token"},
          },
        },
        RecruitProfile: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {type: "string", example: "jane@kaist.ac.kr"},
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
            portfolioUrl: {type: "string", format: "uri"},
            status: {type: "string", example: "submitted"},
            createdAt: {type: "string", format: "date-time"},
            updatedAt: {type: "string", format: "date-time"},
          },
        },
        RecruitUpdateRequest: {
          type: "object",
          description: "Subset of profile fields that can be updated",
          additionalProperties: false,
          properties: {
            name: {type: "string"},
            googleEmail: {type: "string", format: "email"},
            phone: {type: "string"},
            department: {type: "string"},
            studentId: {type: "string"},
            motivation: {type: "string"},
            experience: {type: "string"},
            wantsToDo: {type: "string"},
            githubUsername: {type: "string"},
            portfolioUrl: {type: "string", format: "uri"},
          },
        },
        RecruitResetRequest: {
          type: "object",
          required: ["kaistEmail"],
          properties: {
            kaistEmail: {type: "string", format: "email"},
          },
        },
        RecruitConfig: {
          type: "object",
          properties: {
            isOpen: {type: "boolean"},
            openAt: {type: "string", format: "date-time"},
            closeAt: {type: "string", format: "date-time"},
            messageWhenClosed: {type: "string"},
            semester: {type: "string"},
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: {$ref: "#/components/schemas/ErrorResponse"},
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: {$ref: "#/components/schemas/ValidationErrorResponse"},
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {$ref: "#/components/schemas/ErrorResponse"},
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {$ref: "#/components/schemas/ErrorResponse"},
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      "/users/me": {
        patch: {
          summary: "Update authenticated user profile",
          tags: ["Users"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {$ref: "#/components/schemas/UserUpdateRequest"},
              },
            },
          },
          responses: {
            "200": {
              description: "Profile updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      user: {$ref: "#/components/schemas/User"},
                    },
                    required: ["user"],
                  },
                },
              },
            },
            "400": {
              description: "Invalid update payload",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/LegacyErrorResponse"},
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/Error"},
                },
              },
            },
            "403": {
              description: "Restricted fields",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/LegacyErrorResponse"},
                },
              },
            },
          },
          security: [{bearerAuth: []}],
        },
      },
      "/users/link-member": {
        post: {
          tags: ["Users"],
          summary: "Link authenticated user to a member record",
          description: "Associates the currently authenticated user with a member using a one-time link code.",
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["linkCode"],
                  properties: {
                    linkCode: {
                      type: "string",
                      description: "One-time code issued by an admin when creating a member",
                      example: "GDGOC-123456",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Member linked successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "user"],
                    properties: {
                      ok: {
                        type: "boolean",
                        example: true,
                      },
                      user: {
                        $ref: "#/components/schemas/User",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid or missing link code",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            "404": {
              description: "Link code not found or already used",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            default: {
              description: "Unexpected error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
          },
        },
      },
      "/posts/{postId}": {
        get: {
          tags: ["Posts"],
          summary: "Get a single post",
          description: "Returns post content and increments viewCount on 200 OK responses. Returns 304 without incrementing the counter when the client's ETag matches.",
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              schema: {type: "string"},
            },
          ],
          responses: {
            "200": {
              description: "Post retrieved successfully (viewCount incremented)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      post: {$ref: "#/components/schemas/Post"},
                    },
                  },
                },
              },
            },
            "304": {
              description: "Not modified - viewCount not incremented",
            },
            "404": {
              description: "Post not found",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/Error"},
                },
              },
            },
          },
        },
      },
      "/images": {
        post: {
          tags: ["Images"],
          summary: "Upload an image (multipart)",
          description: "Uploads an image file to Firebase Storage and persists metadata in Firestore. Requires MEMBER or ADMIN role.",
          security: [{bearerAuth: []}],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "Image file to upload",
                    },
                    name: {type: "string", description: "Optional display name"},
                    description: {type: "string", description: "Optional description"},
                    scope: {
                      type: "string",
                      enum: ["public", "members", "private"],
                      description: "Visibility scope; defaults to members",
                    },
                  },
                  required: ["file"],
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Image uploaded",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["image"],
                    properties: {
                      image: {$ref: "#/components/schemas/Image"},
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid payload or unsupported file type",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/ErrorResponse"},
                  examples: {
                    invalidType: {
                      summary: "Unsupported MIME type",
                      value: {error: {code: "INVALID_FILE_TYPE", message: "Invalid file type"}},
                    },
                  },
                },
              },
            },
            "413": {
              description: "Payload too large (max 5MB)",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/ErrorResponse"},
                  examples: {
                    tooLarge: {
                      summary: "File exceeds 5MB",
                      value: {error: {code: "PAYLOAD_TOO_LARGE", message: "File too large (max 5MB)"}},
                    },
                  },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {"application/json": {schema: {$ref: "#/components/schemas/ErrorResponse"}}},
            },
            "403": {
              description: "Insufficient role",
              content: {"application/json": {schema: {$ref: "#/components/schemas/ErrorResponse"}}},
            },
          },
        },
      },
      "/images/{imageId}": {
        get: {
          tags: ["Images"],
          summary: "Fetch image metadata",
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
              description: "Image found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["image"],
                    properties: {
                      image: {$ref: "#/components/schemas/Image"},
                    },
                  },
                },
              },
            },
            "401": {
              description: "Authentication required for non-public scopes",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
            "404": {
              description: "Image not found",
              content: {"application/json": {schema: {$ref: "#/components/schemas/ErrorResponse"}}},
            },
          },
        },
        delete: {
          tags: ["Images"],
          summary: "Delete an image",
          description: "Deletes the image file from storage and removes metadata. Only uploader or admin may delete.",
          security: [{bearerAuth: []}],
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
              description: "Deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {ok: {type: "boolean", example: true}},
                  },
                },
              },
            },
            "400": {
              description: "Invalid id",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
            "401": {
              description: "Authentication required",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
            "403": {
              description: "Forbidden",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
            "404": {
              description: "Not found",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
          },
        },
      },
      "/recruit/applications": {
        post: {
          tags: ["Recruit"],
          summary: "Submit recruiting application",
          description: "Wraps the legacy recruitApply Cloud Function.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {$ref: "#/components/schemas/RecruitApplicationRequest"},
              },
            },
          },
          responses: {
            "201": {
              description: "Application stored successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {success: {type: "boolean", example: true}},
                  },
                },
              },
            },
            "409": {description: "Application already exists"},
          },
        },
      },
      "/recruit/login": {
        post: {
          tags: ["Recruit"],
          summary: "Login to recruiting portal",
          description: "Wraps the legacy recruitLogin Cloud Function.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {$ref: "#/components/schemas/RecruitLoginRequest"},
              },
            },
          },
          responses: {
            "200": {
              description: "Successful login",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/RecruitSessionResponse"},
                },
              },
            },
            "401": {description: "Invalid credentials"},
            "423": {description: "Account locked"},
          },
        },
      },
      "/admin/members/{memberId}/reset-link-code": {
        post: {
          tags: ["Admin"],
          summary: "Reset member link code",
          description: "Generates a new member link code with optional custom expiry (days). Admin only.",
          security: [{bearerAuth: []}],
          parameters: [
            {
              name: "memberId",
              in: "path",
              required: true,
              schema: {type: "string"},
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    expiresInDays: {
                      type: "number",
                      minimum: 1,
                      description: "Positive number of days before the link expires",
                    },
                  },
                  required: ["expiresInDays"],
                  additionalProperties: false,
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Link code reset",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["member", "linkCode"],
                    properties: {
                      member: {$ref: "#/components/schemas/User"},
                      linkCode: {
                        type: "string",
                        description: "Newly issued link code",
                        example: "ABCD-1234",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request payload",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
            "401": {
              description: "Authentication required",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
            "403": {
              description: "Forbidden - admin only",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
            "404": {
              description: "Member not found",
              content: {"application/json": {schema: {$ref: "#/components/schemas/LegacyErrorResponse"}}},
            },
          },
        },
      },
      "/recruit/me": {
        get: {
          tags: ["Recruit"],
          summary: "Fetch current recruiting profile",
          security: [{recruitSession: []}],
          responses: {
            "200": {
              description: "Profile loaded",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/RecruitProfile"},
                },
              },
            },
            "401": {description: "Missing or invalid session token"},
            "404": {description: "Application not found"},
          },
        },
        patch: {
          tags: ["Recruit"],
          summary: "Update recruiting profile",
          description: "Wraps the legacy recruitUpdate Cloud Function. Requires recruit session token.",
          security: [{recruitSession: []}],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {$ref: "#/components/schemas/RecruitUpdateRequest"},
              },
            },
          },
          responses: {
            "200": {
              description: "Profile updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {success: {type: "boolean", example: true}},
                  },
                },
              },
            },
            "400": {description: "No updatable fields provided"},
            "401": {description: "Missing or invalid session token"},
          },
        },
      },
      "/recruit/reset-password": {
        post: {
          tags: ["Recruit"],
          summary: "Reset recruiting portal password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {$ref: "#/components/schemas/RecruitResetRequest"},
              },
            },
          },
          responses: {
            "200": {
              description: "Reset request processed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {success: {type: "boolean", example: true}},
                  },
                },
              },
            },
          },
        },
      },
      "/recruit/config": {
        get: {
          tags: ["Recruit"],
          summary: "Retrieve recruiting configuration",
          responses: {
            "200": {
              description: "Configuration payload",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/RecruitConfig"},
                },
              },
            },
          },
        },
      },
      "/healthz": {
        get: {
          tags: ["System"],
          summary: "서버 상태 및 종속성 확인",
          parameters: [
            {
              in: "query",
              name: "deep",
              description: "Set to 1 to perform dependency checks (Firestore, Storage, Redis)",
              required: false,
              schema: {type: "string", enum: ["1"]},
            },
          ],
          responses: {
            "200": {
              description: "Health check succeeded",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/HealthCheckResponse"},
                },
              },
            },
            "503": {
              description: "Service unavailable",
              content: {
                "application/json": {
                  schema: {$ref: "#/components/schemas/HealthCheckFailureResponse"},
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    path.join(docsDir, "../routes/v2/**/*.ts"),
    path.join(docsDir, "../controllers/v2/**/*.ts"),
  ],
};
