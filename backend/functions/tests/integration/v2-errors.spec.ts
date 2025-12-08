import {afterAll, beforeAll, beforeEach, describe, expect, it} from "@jest/globals";
import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "./setup";

let app: ReturnType<typeof createTestApp>;

function pickErrorCode(body: any): string | undefined {
  const e = body?.error;
  if (!e) return undefined;
  if (typeof e === "object") return e.code;
  return undefined;
}

function pickErrorMessage(body: any): string | undefined {
  const e = body?.error;
  if (!e) return undefined;
  if (typeof e === "string") return e;
  if (typeof e === "object") return e.message ?? e.code;
  return undefined;
}

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

    const code = pickErrorCode(response.body);
    expect(code).toBe("VALIDATION_ERROR");
    if (typeof response.body.error === "object") {
      expect(Array.isArray(response.body.error.details)).toBe(true);
    }
  });

  it("returns UNAUTHORIZED when auth header is missing", async () => {
    const response = await request(app).get("/v2/users/me").expect(401);
    const code = pickErrorCode(response.body);
    const message = pickErrorMessage(response.body);
    expect(code ?? message).toBe("UNAUTHORIZED");
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

    expect(typeof response.body.error).toBe("string");
    const message = pickErrorMessage(response.body) || "";
    expect(message).toContain("Requires one of the following roles");
    expect(message).toContain("ADMIN");
  });

  it("returns NOT_FOUND for missing resources", async () => {
    const response = await request(app)
      .get("/v2/posts/nonexistent")
      .expect(404);

    const code = pickErrorCode(response.body);
    const message = pickErrorMessage(response.body);
    expect(code ?? message).toBe("NOT_FOUND");
  });
});
