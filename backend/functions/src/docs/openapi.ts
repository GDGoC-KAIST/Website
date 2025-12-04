import path from "path";
import type {Options} from "swagger-jsdoc";

const tiptapExample = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Hello TipTap!",
        },
      ],
    },
  ],
};

const schemas = {
  User: {
    type: "object",
    properties: {
      id: {type: "string"},
      email: {type: "string", format: "email"},
      name: {type: "string"},
      roles: {
        type: "array",
        items: {type: "string", enum: ["USER", "MEMBER", "ADMIN"]},
      },
      memberId: {type: "string", nullable: true},
      createdAt: {type: "string"},
    },
  },
  Comment: {
    type: "object",
    properties: {
      id: {type: "string"},
      targetType: {type: "string", enum: ["post", "project", "seminar"]},
      targetId: {type: "string"},
      writerUserId: {type: "string"},
      content: {type: "string"},
      createdAt: {type: "string"},
    },
  },
  LikeToggleResult: {
    type: "object",
    properties: {
      liked: {type: "boolean"},
      likeCount: {type: "integer"},
    },
    required: ["liked", "likeCount"],
  },
  Post: {
    type: "object",
    properties: {
      id: {type: "string"},
      type: {type: "string", enum: ["blog", "notice"]},
      title: {type: "string"},
      content: {$ref: "#/components/schemas/TipTapDoc"},
      visibility: {type: "string", enum: ["public", "members_only", "private"]},
      authorUserId: {type: "string"},
      commentCount: {type: "integer"},
      likeCount: {type: "integer"},
      createdAt: {type: "string"},
    },
    example: {
      id: "post_123",
      type: "blog",
      title: "Sample",
      content: tiptapExample,
    },
  },
  TipTapDoc: {
    type: "object",
    additionalProperties: true,
  },
  Error: {
    type: "object",
    properties: {
      error: {
        type: "object",
        properties: {
          code: {type: "string"},
          message: {type: "string"},
        },
        required: ["code", "message"],
      },
    },
    required: ["error"],
  },
  CursorPagination: {
    type: "object",
    properties: {
      nextCursor: {type: "string", nullable: true},
      items: {
        type: "array",
        items: {type: "object"},
      },
    },
  },
};

const paths = {
  "/v2/auth/login/github": {
    post: {
      summary: "Login with GitHub",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {githubAccessToken: {type: "string"}},
              required: ["githubAccessToken"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login success",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  user: {$ref: "#/components/schemas/User"},
                  accessToken: {type: "string"},
                  refreshToken: {type: "string"},
                },
              },
            },
          },
        },
        400: {description: "Invalid input", content: {"application/json": {schema: {$ref: "#/components/schemas/Error"}}}},
      },
    },
  },
  "/v2/auth/refresh": {
    post: {
      summary: "Rotate refresh token",
      description: "Refresh tokens are bound to sessions. Reusing an older token triggers REFRESH_REUSE_DETECTED and revokes all sessions.",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {refreshToken: {type: "string"}},
              required: ["refreshToken"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Rotation success",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  accessToken: {type: "string"},
                  refreshToken: {type: "string"},
                },
              },
            },
          },
        },
        401: {
          description: "Invalid or reused token (REFRESH_REUSE_DETECTED)",
          content: {"application/json": {schema: {$ref: "#/components/schemas/Error"}}},
        },
      },
    },
  },
  "/v2/auth/logout": {
    post: {
      summary: "Logout",
      tags: ["Auth"],
      security: [{bearerAuth: []}],
      parameters: [
        {
          in: "query",
          name: "all",
          schema: {type: "boolean"},
          description: "Set to true to revoke all active sessions for the current user.",
        },
        {
          in: "query",
          name: "sessionId",
          schema: {type: "string"},
          description: "Optional session identifier to revoke. Defaults to the current session.",
        },
      ],
      responses: {
        200: {description: "Logged out"},
        401: {description: "Unauthorized", content: {"application/json": {schema: {$ref: "#/components/schemas/Error"}}}},
      },
    },
  },
  "/v2/users/me": {
    get: {
      summary: "Get current user profile",
      tags: ["Users"],
      security: [{bearerAuth: []}],
      responses: {
        200: {
          description: "Profile",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {user: {$ref: "#/components/schemas/User"}},
                required: ["user"],
              },
            },
          },
        },
        401: {description: "Unauthorized", content: {"application/json": {schema: {$ref: "#/components/schemas/Error"}}}},
      },
    },
  },
  "/v2/users/link-member": {
    post: {
      summary: "Link member using link code",
      tags: ["Users"],
      security: [{bearerAuth: []}],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {linkCode: {type: "string"}},
              required: ["linkCode"],
            },
          },
        },
      },
      responses: {
        200: {description: "Linked"},
        400: {description: "Invalid code", content: {"application/json": {schema: {$ref: "#/components/schemas/Error"}}}},
        401: {description: "Unauthorized"},
      },
    },
  },
  "/v2/posts": {
    post: {
      summary: "Create post",
      tags: ["Posts"],
      security: [{bearerAuth: []}],
      responses: {
        201: {
          description: "Created",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {post: {$ref: "#/components/schemas/Post"}},
                required: ["post"],
              },
            },
          },
        },
        401: {description: "Unauthorized"},
      },
    },
    get: {
      summary: "List posts",
      tags: ["Posts"],
      responses: {
        200: {
          description: "Posts",
          content: {
            "application/json": {
              schema: {
                type: "object",
                allOf: [
                  {$ref: "#/components/schemas/CursorPagination"},
                  {
                    properties: {
                      posts: {
                        type: "array",
                        items: {$ref: "#/components/schemas/Post"},
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  "/v2/posts/{postId}": {
    get: {
      summary: "Get post",
      tags: ["Posts"],
      parameters: [{name: "postId", in: "path", required: true, schema: {type: "string"}}],
      responses: {200: {description: "Post", content: {"application/json": {schema: {type: "object", properties: {post: {$ref: "#/components/schemas/Post"}}}}}}},
    },
    patch: {
      summary: "Update post",
      tags: ["Posts"],
      security: [{bearerAuth: []}],
      parameters: [{name: "postId", in: "path", required: true, schema: {type: "string"}}],
      responses: {
        200: {description: "Updated"},
        403: {description: "Forbidden", content: {"application/json": {schema: {$ref: "#/components/schemas/Error"}}}},
      },
    },
    delete: {
      summary: "Delete post",
      tags: ["Posts"],
      security: [{bearerAuth: []}],
      parameters: [{name: "postId", in: "path", required: true, schema: {type: "string"}}],
      responses: {
        200: {description: "Deleted"},
        403: {description: "Forbidden"},
      },
    },
  },
  "/v2/comments": {
    post: {
      summary: "Create comment",
      tags: ["Comments"],
      security: [{bearerAuth: []}],
      responses: {
        201: {
          description: "Created",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  comment: {$ref: "#/components/schemas/Comment"},
                },
                required: ["comment"],
              },
            },
          },
        },
        401: {description: "Unauthorized"},
      },
    },
    get: {
      summary: "List comments for target",
      tags: ["Comments"],
      parameters: [
        {name: "targetType", in: "query", schema: {type: "string"}, required: true},
        {name: "targetId", in: "query", schema: {type: "string"}, required: true},
      ],
      responses: {200: {description: "Comments"}},
    },
  },
  "/v2/likes/toggle": {
    post: {
      summary: "Toggle like",
      tags: ["Likes"],
      security: [{bearerAuth: []}],
      responses: {
        200: {
          description: "Toggle result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  likeToggle: {$ref: "#/components/schemas/LikeToggleResult"},
                },
                required: ["likeToggle"],
              },
            },
          },
        },
      },
    },
  },
  "/v2/galleries": {
    get: {
      summary: "List galleries",
      tags: ["Galleries"],
      responses: {200: {description: "Galleries list"}},
    },
    post: {
      summary: "Create gallery",
      tags: ["Galleries"],
      security: [{bearerAuth: []}],
      responses: {201: {description: "Created"}, 403: {description: "Forbidden"}},
    },
  },
  "/v2/admin/members": {
    post: {
      summary: "Create member",
      tags: ["Admin"],
      security: [{bearerAuth: []}],
      responses: {
        201: {description: "Created"},
        403: {description: "Forbidden"},
      },
    },
  },
  "/v2/admin/recruit/applications/{id}/status": {
    patch: {
      summary: "Update application status",
      tags: ["Admin"],
      security: [{bearerAuth: []}],
      parameters: [{name: "id", in: "path", required: true, schema: {type: "string"}}],
      responses: {200: {description: "Updated"}, 403: {description: "Forbidden"}},
    },
  },
  "/v2/admin/migrations/run": {
    post: {
      summary: "Run admin migration",
      tags: ["Admin"],
      security: [{bearerAuth: []}],
      parameters: [
        {name: "name", in: "query", required: true, schema: {type: "string"}},
        {name: "dryRun", in: "query", schema: {type: "boolean"}},
      ],
      responses: {
        200: {description: "Report"},
        403: {description: "Forbidden"},
      },
    },
  },
};

export const openApiOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GDGoC KAIST API v2",
      version: "2.0.0",
      description: "REST API for GDGoC KAIST services.",
    },
    servers: [{url: "/"}],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas,
    },
    security: [{bearerAuth: []}],
    paths,
  },
  apis: [
    path.join(__dirname, "../routes/v2/*.ts"),
    path.join(__dirname, "../types/schema.ts"),
  ],
};
