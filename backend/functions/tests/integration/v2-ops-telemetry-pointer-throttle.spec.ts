import {afterAll, afterEach, beforeAll, describe, expect, it} from "@jest/globals";
import request from "supertest";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "./setup";

const db = getFirestore();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getPointer(visitorId: string) {
  return db.collection("visitorPointers").doc(visitorId).get();
}

async function getSession(sessionId: string) {
  return db.collection("visitorSessions").doc(sessionId).get();
}

describe("Visitor telemetry pointer + throttle", () => {
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

  it("creates a new session and increments aggregates", async () => {
    const visitorId = "visitor-new-session";

    await request(app).get("/v2/healthz").set("x-visitor-id", visitorId).expect(200);

    const pointerSnap = await getPointer(visitorId);
    expect(pointerSnap.exists).toBe(true);
    const pointer = pointerSnap.data() as {lastSessionId: string; lastWriteAt: Timestamp};
    expect(pointer.lastSessionId).toBeTruthy();

    const sessionSnap = await getSession(pointer.lastSessionId);
    expect(sessionSnap.exists).toBe(true);
    const session = sessionSnap.data() as {requestCount: number; ipHash: string; uaSummary: {browser: string}};
    expect(session.requestCount).toBe(1);
    expect(session.ipHash).toBeTruthy();
    expect(session.uaSummary.browser).toBeTruthy();

    const dailySnap = await db.collection("opsDailyAgg").doc(today()).get();
    expect(dailySnap.exists).toBe(true);
    const daily = dailySnap.data() as Record<string, unknown>;
    expect((daily.requestsTotal as number) ?? 0).toBeGreaterThan(0);
    expect(daily.browserFamilyCount).toBeDefined();
  });

  it("throttles writes within 7 seconds", async () => {
    const visitorId = "visitor-throttle";
    await request(app).get("/v2/healthz").set("x-visitor-id", visitorId).expect(200);
    const firstPointer = (await getPointer(visitorId)).data() as {lastSessionId: string; lastWriteAt: Timestamp};
    const firstWriteMs = firstPointer.lastWriteAt.toMillis();

    await request(app).get("/v2/healthz").set("x-visitor-id", visitorId).expect(200);
    const secondPointerSnap = await getPointer(visitorId);
    const secondPointer = secondPointerSnap.data() as {lastSessionId: string; lastWriteAt: Timestamp};

    expect(secondPointer.lastSessionId).toBe(firstPointer.lastSessionId);
    expect(secondPointer.lastWriteAt.toMillis()).toBe(firstWriteMs);

    const sessionSnap = await getSession(firstPointer.lastSessionId);
    const session = sessionSnap.data() as {requestCount: number};
    expect(session.requestCount).toBe(1);
  });

  it("rolls to a new session after inactivity window", async () => {
    const visitorId = "visitor-rollover";
    await request(app).get("/v2/healthz").set("x-visitor-id", visitorId).expect(200);
    const pointerSnap = await getPointer(visitorId);
    const pointer = pointerSnap.data() as {currentSessionId: string};
    const originalSessionId = pointer.currentSessionId;

    const staleTs = Timestamp.fromMillis(Date.now() - 31 * 60 * 1000);
    await db.collection("visitorPointers").doc(visitorId).set(
      {lastSeenAt: staleTs, expiresAt: staleTs, lastWriteAt: staleTs},
      {merge: true}
    );
    await db.collection("visitorSessions").doc(originalSessionId).set(
      {lastSeenAt: staleTs, expiresAt: staleTs},
      {merge: true}
    );

    await request(app).get("/v2/healthz").set("x-visitor-id", visitorId).expect(200);

    const newPointer = (await getPointer(visitorId)).data() as {currentSessionId: string};
    expect(newPointer.currentSessionId).not.toBe(originalSessionId);
  });

  it("secures admin ops endpoints", async () => {
    const date = today();
    await request(app).get(`/v2/admin/ops/traffic/hourly?date=${date}`).expect(401);

    const adminHeaders = createAuthHeaders("admin-ops", ["ADMIN"]);
    await request(app).get(`/v2/admin/ops/traffic/hourly?date=${date}`).set(adminHeaders).expect(200);
  });

  it("stores hashed/summarized telemetry only", async () => {
    const visitorId = "visitor-privacy";
    await request(app).get("/v2/healthz").set("x-visitor-id", visitorId).expect(200);
    const pointer = (await getPointer(visitorId)).data() as {currentSessionId: string};
    const session = (await getSession(pointer.currentSessionId)).data() as Record<string, unknown>;

    expect(session.ipHash).toBeDefined();
    expect(session.uaSummary).toBeDefined();
    expect(session.userAgent).toBeUndefined();
    expect(session.rawIp).toBeUndefined();

    const daily = (await db.collection("opsDailyAgg").doc(today()).get()).data() || {};
    const keys = Object.keys(daily);
    expect(keys).not.toEqual(expect.arrayContaining(["ip", "rawIp", "userAgent", "userAgentRaw"]));
  });
});
