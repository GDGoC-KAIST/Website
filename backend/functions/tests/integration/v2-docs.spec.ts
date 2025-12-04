import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";

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

describe("API Docs", () => {
  it("returns OpenAPI JSON spec", async () => {
    const response = await request(app).get("/v2/openapi.json").expect(200);
    expect(response.body.openapi).toBe("3.0.0");
    expect(response.body.info?.title).toContain("GDGoC KAIST API v2");
  });

  it("serves Swagger UI HTML", async () => {
    const response = await request(app).get("/v2/docs").expect(200);
    expect(response.text).toContain("swagger-ui");
  });
});
