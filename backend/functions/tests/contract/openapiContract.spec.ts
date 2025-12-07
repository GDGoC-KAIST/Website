import request from "supertest";
import {expect} from "@jest/globals";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "../integration/setup";
import {createTestApp} from "../integration/appFactory";
import {seedUser} from "../utils/testData";
import {validateResponse} from "../utils/openapiValidator";

function assertStatus(res: any, expected: number, label: string) {
  if (res.status !== expected) {
    // eslint-disable-next-line no-console
    console.error(`[${label}] Status Mismatch! Expected ${expected}, got ${res.status}`);
    // eslint-disable-next-line no-console
    console.error(`[${label}] Body:`, JSON.stringify(res.body, null, 2));
    throw new Error(`Status mismatch for ${label}`);
  }
}

let app = createTestApp();
let spec: any;

beforeAll(async () => {
  await setupTestEnv();
  app = createTestApp();
  const response = await request(app).get("/v2/openapi.json").expect(200);
  spec = response.body;

  // Sanity check: Ensure TipTapDoc is present in the spec
  expect(spec.components?.schemas?.TipTapDoc).toBeDefined();
  console.log("✅ Sanity Check: TipTapDoc schema found in OpenAPI spec");
});

beforeEach(async () => {
  await clearFirestore();
});

afterAll(async () => {
  await teardownTestEnv();
});

describe("OpenAPI Contract Tests", () => {
  it("GET /v2/users/me matches User schema", async () => {
    const userId = "contract-user";
    await seedUser(userId, ["USER"]);

    const response = await request(app)
      .get("/v2/users/me")
      .set(createAuthHeaders(userId, ["USER"]))
      .expect(200);
    assertStatus(response, 200, "GET /v2/users/me");
    try {
      validateResponse(response.body.user ?? response.body, "#/components/schemas/User", spec);
    } catch (error) {
      console.error("Contract validation failed:", (error as Error).message);
      console.error("Actual Response Body:", JSON.stringify(response.body, null, 2));
      throw error;
    }
  });

  it("POST /v2/posts returns Post schema", async () => {
    const memberId = "contract-member";
    await seedUser(memberId, ["MEMBER"]);

    const response = await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(memberId, ["MEMBER"]))
      .send({type: "blog", title: "Contract Post", content: "Contract body"})
      .expect(201);
    assertStatus(response, 201, "POST /v2/posts");
    try {
      validateResponse(response.body.post ?? response.body, "#/components/schemas/Post", spec);
    } catch (error) {
      console.error("Contract validation failed:", (error as Error).message);
      console.error("Actual Response Body:", JSON.stringify(response.body, null, 2));
      throw error;
    }
  });

  it("POST /v2/comments returns Comment schema", async () => {
    const authorId = "comment-author";
    await seedUser(authorId, ["MEMBER"]);
    const postRes = await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(authorId, ["MEMBER"]))
      .send({type: "blog", title: "Commentable", content: "Content"})
      .expect(201);
    assertStatus(postRes, 201, "POST /v2/posts (setup)");

    const postId = postRes.body.post.id;

    const commenterId = "comment-user";
    await seedUser(commenterId, ["USER"]);

    const response = await request(app)
      .post("/v2/comments")
      .set(createAuthHeaders(commenterId, ["USER"]))
      .send({targetType: "post", targetId: postId, content: "Nice post!"})
      .expect(201);
    assertStatus(response, 201, "POST /v2/comments");
    try {
      validateResponse(response.body.comment ?? response.body, "#/components/schemas/Comment", spec);
    } catch (error) {
      console.error("Contract validation failed:", (error as Error).message);
      console.error("Actual Response Body:", JSON.stringify(response.body, null, 2));
      throw error;
    }
  });

  it("POST /v2/likes/toggle matches LikeToggle schema", async () => {
    const authorId = "like-author";
    await seedUser(authorId, ["MEMBER"]);
    const postRes = await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(authorId, ["MEMBER"]))
      .send({type: "blog", title: "Likable", content: "Content"})
      .expect(201);
    assertStatus(postRes, 201, "POST /v2/posts (like setup)");

    const postId = postRes.body.post.id;

    const likerId = "liker-user";
    await seedUser(likerId, ["USER"]);

    const response = await request(app)
      .post("/v2/likes/toggle")
      .set(createAuthHeaders(likerId, ["USER"]))
      .send({targetType: "post", targetId: postId})
      .expect(200);
    assertStatus(response, 200, "POST /v2/likes/toggle");
    try {
      validateResponse(
        response.body.likeToggle ?? response.body,
        "#/components/schemas/LikeToggleResult",
        spec
      );
    } catch (error) {
      console.error("Contract validation failed:", (error as Error).message);
      console.error("Actual Response Body:", JSON.stringify(response.body, null, 2));
      throw error;
    }
  });

  describe("Recruit V2 Contract", () => {
    it("should have all 6 recruit endpoints defined in OpenAPI", () => {
      const paths = Object.keys(spec.paths || {});
      const recruitPaths = [
        "/recruit/applications",
        "/recruit/login",
        "/recruit/me",
        "/recruit/reset-password",
        "/recruit/config",
      ];

      recruitPaths.forEach((p) => {
        expect(paths).toContain(p);
      });
    });

    it("should require recruitSession auth for /recruit/me endpoints", () => {
      const mePath = spec.paths["/recruit/me"];
      expect(mePath).toBeDefined();
      expect(mePath.get).toBeDefined();
      expect(mePath.patch).toBeDefined();
      expect(mePath.get.security).toEqual([{recruitSession: []}]);
      expect(mePath.patch.security).toEqual([{recruitSession: []}]);
    });

    it("should have recruitSession security scheme defined", () => {
      expect(spec.components?.securitySchemes?.recruitSession).toBeDefined();
      expect(spec.components.securitySchemes.recruitSession.type).toBe("http");
      expect(spec.components.securitySchemes.recruitSession.scheme).toBe("bearer");
    });

    it("should have all recruit schemas defined", () => {
      const schemas = spec.components?.schemas || {};
      const requiredSchemas = [
        "RecruitApplicationRequest",
        "RecruitLoginRequest",
        "RecruitSessionResponse",
        "RecruitProfile",
        "RecruitUpdateRequest",
        "RecruitResetRequest",
        "RecruitConfig",
      ];

      requiredSchemas.forEach((schemaName) => {
        expect(schemas[schemaName]).toBeDefined();
      });
    });
  });
});
