import request from "supertest";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "../integration/setup";
import {createTestApp} from "../integration/appFactory";

let app = createTestApp();

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

describe("Pre-Prod Smoke Tests", () => {
  it("serves Swagger UI HTML", async () => {
    const response = await request(app).get("/v2/docs").expect(200);
    expect(response.text).toContain("swagger-ui");
  });

  it("returns OpenAPI JSON with version 3", async () => {
    const response = await request(app).get("/v2/openapi.json").expect(200);
    expect(response.body.openapi).toBe("3.0.0");
  });

  it("returns standardized error structure for 404", async () => {
    const response = await request(app).get("/v2/posts/non-existent").expect(404);
    expect(response.body).toHaveProperty("error.code");
    expect(response.body).toHaveProperty("error.message");
  });
});
