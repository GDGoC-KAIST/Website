import {afterAll, afterEach, beforeAll, describe, expect, it} from "@jest/globals";
import request from "supertest";
import {Timestamp, getFirestore} from "firebase-admin/firestore";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";

let app = createTestApp();
const db = getFirestore();

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

describe("Visitor Telemetry", () => {
  const visitorId = "v-test-1";

  const fetchSession = async () => {
    const pointerSnap = await db.collection("visitorPointers").doc(visitorId).get();
    const sessionId = pointerSnap.get("lastSessionId") as string | undefined;
    const sessionSnap = sessionId ? await db.collection("visitorSessions").doc(sessionId).get() : null;
    return {pointerSnap, sessionSnap, sessionId};
  };

  it("creates a new session for a new visitor", async () => {
    await request(app).get("/v2/healthz").set("X-Visitor-Id", visitorId).expect(200);

    const {pointerSnap, sessionSnap, sessionId} = await fetchSession();
    expect(pointerSnap.exists).toBe(true);
    expect(typeof sessionId).toBe("string");
    expect(sessionSnap?.exists).toBe(true);
    expect(sessionSnap?.get("visitorId")).toBe(visitorId);
    expect(sessionSnap?.get("requestCount")).toBe(1);
  });

  it("increments requestCount for returning visitor within session window", async () => {
    await request(app).get("/v2/healthz").set("X-Visitor-Id", visitorId).expect(200);
    const {sessionId: firstSessionId} = await fetchSession();

    // Bump lastWriteAt backward to avoid the 7s write throttle when issuing the second request.
    await db.collection("visitorPointers").doc(visitorId).set(
      {lastWriteAt: Timestamp.fromMillis(Date.now() - 8_000)},
      {merge: true}
    );

    await request(app).get("/v2/healthz").set("X-Visitor-Id", visitorId).expect(200);
    const {sessionSnap} = await fetchSession();

    expect(sessionSnap?.id).toBe(firstSessionId);
    expect(sessionSnap?.get("requestCount")).toBe(2);
  });

  it("starts a new session after timeout", async () => {
    await request(app).get("/v2/healthz").set("X-Visitor-Id", visitorId).expect(200);
    const {sessionId: firstSessionId} = await fetchSession();

    if (firstSessionId) {
      const staleMs = Date.now() - 31 * 60 * 1000;
      await db.collection("visitorSessions").doc(firstSessionId).update({
        lastSeenAt: Timestamp.fromMillis(staleMs),
        expiresAt: Timestamp.fromMillis(staleMs),
      });
    }

    await request(app).get("/v2/healthz").set("X-Visitor-Id", visitorId).expect(200);
    const {sessionId: secondSessionId} = await fetchSession();

    expect(firstSessionId).toBeDefined();
    expect(secondSessionId).toBeDefined();
    expect(secondSessionId).not.toBe(firstSessionId);
  });

  it("stores only hashed/summarized telemetry (no raw PII)", async () => {
    await request(app).get("/v2/healthz").set("X-Visitor-Id", visitorId).expect(200);
    const {sessionSnap} = await fetchSession();
    const data = sessionSnap?.data() ?? {};

    expect(data).not.toHaveProperty("ip");
    expect(data).not.toHaveProperty("userAgent");
    expect(data).toHaveProperty("ipHash");
    expect(data).toHaveProperty("uaSummary");
  });
});
