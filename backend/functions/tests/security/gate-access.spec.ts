import request from "supertest";
import {createTestApp} from "../integration/appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "../integration/setup";

let app = createTestApp();

// Security gate hits emulator endpoints that can be slow to warm up; allow extra time.
jest.setTimeout(30000);

describe("Security Gate – admin access controls", () => {
  beforeAll(async () => {
    await setupTestEnv();
    app = createTestApp();
    // Warm up health endpoint to ensure emulator connections are ready before auth checks.
    await request(app).get("/healthz").expect(200);
  });

  afterEach(async () => {
    await clearFirestore();
  });

  afterAll(async () => {
    await teardownTestEnv();
  });

  it("locks admin ops traffic endpoint", async () => {
    await request(app).get("/v2/admin/ops/traffic/daily").expect(401);

    const userHeaders = createAuthHeaders("user-1", ["USER"]);
    await request(app).get("/v2/admin/ops/traffic/daily").set(userHeaders).expect(403);

    const adminHeaders = createAuthHeaders("admin-1", ["ADMIN"]);
    await request(app).get("/v2/admin/ops/traffic/daily").set(adminHeaders).expect(200);
  });

  it("locks admin migrations run endpoint", async () => {
    await request(app).post("/v2/admin/migrations/run").expect(401);

    const userHeaders = createAuthHeaders("user-2", ["USER"]);
    await request(app).post("/v2/admin/migrations/run").set(userHeaders).expect(403);

    const adminHeaders = createAuthHeaders("admin-2", ["ADMIN"]);
    // Unknown migration name is acceptable as long as access control passes (expect 400 or 200, not 401/403)
    const res = await request(app)
      .post("/v2/admin/migrations/run?name=unknown")
      .set(adminHeaders)
      .send({dryRun: true});
    expect([200, 400]).toContain(res.status);
  });
});
