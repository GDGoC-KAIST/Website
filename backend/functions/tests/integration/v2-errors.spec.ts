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

describe("Standardized error responses", () => {
  it("returns VALIDATION_ERROR for invalid request bodies", async () => {
    const response = await request(app)
      .post("/v2/users/link-member")
      .set(createAuthHeaders("validator", ["MEMBER"]))
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(response.body.error.details)).toBe(true);
  });

  it("returns UNAUTHORIZED when auth header is missing", async () => {
    const response = await request(app).get("/v2/users/me").expect(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns FORBIDDEN for insufficient role", async () => {
    const response = await request(app)
      .post("/v2/admin/members")
      .set(createAuthHeaders("member-user", ["MEMBER"]))
      .send({
        name: "Test User",
        studentId: "20240001",
        department: "CS",
        generation: 1,
        role: "Member",
      })
      .expect(403);

    expect(["FORBIDDEN", "INSUFFICIENT_ROLE"]).toContain(response.body.error.code);
  });

  it("returns NOT_FOUND for missing resources", async () => {
    const response = await request(app)
      .get("/v2/posts/nonexistent")
      .expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
