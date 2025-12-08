import request from "supertest";
import {getFirestore} from "firebase-admin/firestore";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";

let app = createTestApp();

describe("Ops Abuse Guard", () => {
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

  it("returns 429 after exceeding recruit login limit", async () => {
    const body = {kaistEmail: "abuse@test.kaist.edu", password: "wrong-password"};
    const visitorId = "abuse-visitor";

    for (let i = 0; i < 10; i += 1) {
      await request(app).post("/v2/recruit/login").set("x-visitor-id", visitorId).send(body).expect(401);
    }

    await request(app).post("/v2/recruit/login").set("x-visitor-id", visitorId).send(body).expect(429);
  });

  it("stores hashed abuse counter keys (no raw IP)", async () => {
    const body = {kaistEmail: "abuse@test.kaist.edu", password: "wrong-password"};
    await request(app).post("/v2/recruit/login").set("x-visitor-id", "abuse-hash-check").send(body).expect(401);

    const snap = await getFirestore().collection("opsAbuseCounters").get();
    expect(snap.size).toBeGreaterThan(0);
    snap.forEach((doc) => {
      expect(doc.id).toContain("recruit_login");
      expect(doc.id).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
    });
  });
});
