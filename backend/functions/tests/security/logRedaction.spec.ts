import {afterAll, afterEach, beforeAll, describe, expect, it, jest} from "@jest/globals";
import request from "supertest";
import {createTestApp} from "../integration/appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "../integration/setup";

describe("Log Redaction", () => {
  let app = createTestApp();
  const sensitive = {password: "secret123", email: "test@kaist.ac.kr"};

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

  it("masks sensitive fields in request logs", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined as unknown as void);

    await request(app)
      .get("/v2/healthz")
      .query(sensitive)
      .expect(200);

    const payloads = consoleSpy.mock.calls.map((call: unknown[]) => call[0] as unknown);
    const requestLogs = payloads.filter((entry): entry is string => typeof entry === "string" && entry.includes("request_completed"));

    expect(requestLogs.length).toBeGreaterThan(0);
    for (const entry of requestLogs) {
      expect(entry).not.toContain("secret123");
      expect(entry).not.toContain("test@kaist.ac.kr");
    }

    consoleSpy.mockRestore();
  });
});
