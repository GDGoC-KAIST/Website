import {afterAll, afterEach, beforeAll, describe, expect, it, jest} from "@jest/globals";
import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";

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

describe("Telemetry", () => {
  it("logs ipHash internally but not in responses", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined as unknown as void);

    const res = await request(app).get("/v2/healthz").expect(200);

    const entries = spy.mock.calls.map((call: unknown[]) => call[0] as unknown);
    const telemetryLogs = entries.filter((entry): entry is string => typeof entry === "string" && entry.includes("ipHash"));
    expect(telemetryLogs.length).toBeGreaterThan(0);
    expect(res.body.ipHash).toBeUndefined();
    expect(typeof res.text === "string" ? res.text.includes("ipHash") : false).toBe(false);

    spy.mockRestore();
  });

  it("summarizes UA", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined as unknown as void);

    await request(app)
      .get("/v2/healthz")
      .set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
      .expect(200);

    const entries = spy.mock.calls.map((call: unknown[]) => call[0] as unknown);
    const telemetryLogs = entries.filter((entry): entry is string => typeof entry === "string" && entry.includes("telemetry"));
    expect(telemetryLogs.length).toBeGreaterThan(0);
    expect(telemetryLogs.some((entry) => entry.includes("Chrome"))).toBe(true);
    expect(telemetryLogs.some((entry) => entry.includes("Mac"))).toBe(true);

    spy.mockRestore();
  });
});
