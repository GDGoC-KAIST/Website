import request from "supertest";
import {getFirestore} from "firebase-admin/firestore";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";
import {visitorSessionService} from "../../src/services/visitorSessionService";
import {hashIp} from "../../src/utils/ipHash";

let app = createTestApp();
const db = getFirestore();

describe("Degrade mode & proxy trust", () => {
  beforeAll(async () => {
    await setupTestEnv();
    app = createTestApp();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await clearFirestore();
  });

  afterAll(async () => {
    await teardownTestEnv();
  });

  it("returns 200 even if telemetry write fails", async () => {
    jest.spyOn(visitorSessionService, "upsertSession").mockRejectedValueOnce(new Error("firestore down"));

    await request(app).get("/healthz").set("x-visitor-id", "degrade-test").expect(200);
  });

  it("hashes client IP from X-Forwarded-For when trust proxy is enabled", async () => {
    const visitorId = "proxy-test";
    const forwarded = "1.2.3.4, 10.0.0.1";

    await request(app).get("/healthz").set("x-visitor-id", visitorId).set("x-forwarded-for", forwarded).expect(200);

    const pointerSnap = await db.collection("visitorPointers").doc(visitorId).get();
    const sessionId = pointerSnap.get("currentSessionId") as string;
    const sessionSnap = await db.collection("visitorSessions").doc(sessionId).get();
    const ipHash = sessionSnap.get("ipHash") as string;

    const expected = hashIp("1.2.3.4", process.env.IP_HASH_SALT || "test-ip-hash-salt");
    expect(ipHash).toBe(expected);
  });
});
