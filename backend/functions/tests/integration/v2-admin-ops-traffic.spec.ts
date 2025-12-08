import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "./setup";

describe("Admin Ops Traffic", () => {
  let app = createTestApp();

  beforeAll(async () => {
    await setupTestEnv();
    app = createTestApp();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  afterAll(async () => {
    await teardownTestEnv();
  });

  it("rejects unauthenticated access", async () => {
    await request(app).get("/v2/admin/ops/traffic/hourly?date=today").expect(401);
  });

  it("returns zero-filled 24-hour payload for today", async () => {
    const adminHeaders = createAuthHeaders("admin-ops", ["ADMIN"]);

    const res = await request(app)
      .get("/v2/admin/ops/traffic/hourly?date=today")
      .set(adminHeaders)
      .expect(200);

    expect(res.body.date).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(Array.isArray(res.body.hours)).toBe(true);
    expect(res.body.hours).toHaveLength(24);
    res.body.hours.forEach((entry: {hour: string; requestsTotal: number}) => {
      expect(typeof entry.hour).toBe("string");
      expect(entry.hour).toHaveLength(2);
      expect(typeof entry.requestsTotal).toBe("number");
    });
  });
});
