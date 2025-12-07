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

describe("Healthz Smoke", () => {
  it("returns ok response", async () => {
    const res = await request(app).get("/v2/healthz").expect(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("service", "functions");
    expect(typeof res.body.ts).toBe("string");
  });
});
