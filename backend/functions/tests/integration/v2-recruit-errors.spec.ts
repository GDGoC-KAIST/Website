import request from "supertest";
import {setupTestEnv, teardownTestEnv} from "./setup";
import {createTestApp} from "./appFactory";
import {clearCollections} from "../helpers/firestoreCleanup";

let app = createTestApp();

beforeAll(async () => {
  await setupTestEnv();
  app = createTestApp();
});

beforeEach(async () => {
  await clearCollections(["recruitApplications", "recruitSessions", "recruitConfig"]);
});

afterAll(async () => {
  await teardownTestEnv();
});

describe("Recruit error bridge", () => {
  it("returns legacy unauthorized format when token missing", async () => {
    const res = await request(app).get("/v2/recruit/me").expect(401);
    expect(res.body).toEqual({error: "Unauthorized"});
  });

  it("returns legacy format for malformed token", async () => {
    const res = await request(app)
      .get("/v2/recruit/me")
      .set("Authorization", "Bearer invalid")
      .expect(401);
    expect(res.body).toEqual({error: "Unauthorized"});
  });
});
