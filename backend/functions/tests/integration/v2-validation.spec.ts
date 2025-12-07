import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "./setup";

let app: ReturnType<typeof createTestApp>;

beforeAll(async () => {
  await setupTestEnv();
  app = createTestApp();
});

beforeEach(async () => {
  await clearFirestore();
});

afterAll(async () => {
  await teardownTestEnv();
});

describe("Validation middleware regressions", () => {
  it("returns validation error for missing linkCode", async () => {
    const response = await request(app)
      .post("/v2/users/link-member")
      .set(createAuthHeaders("link-member-user", ["MEMBER"]))
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(response.body.error.details)).toBe(true);
    expect(response.body.error.details[0]?.source).toBe("body");
    expect(response.body.error.details[0]?.issues[0]?.path).toContain("linkCode");
  });

  it("enforces types for likes toggle", async () => {
    const response = await request(app)
      .post("/v2/likes/toggle")
      .set(createAuthHeaders("like-user", ["MEMBER"]))
      .send({targetType: "post", targetId: 12345})
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details[0]?.source).toBe("body");
    expect(response.body.error.details[0]?.issues[0]?.path).toContain("targetId");
  });

  it("requires refreshToken for auth refresh", async () => {
    const response = await request(app)
      .post("/v2/auth/refresh")
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
