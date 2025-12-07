import request from "supertest";
import {createTestApp} from "../integration/appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "../integration/setup";

describe("Log Redaction", () => {
  let app = createTestApp();
  const body = {password: "secret123", email: "test@kaist.ac.kr"};

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

    await request(app).post("/v2/healthz").send(body).expect(404);

    const payloads = consoleSpy.mock.calls.map((call) => call[0] as string);
    const requestLogs = payloads.filter((entry) => typeof entry === "string" && entry.includes("request_completed"));

    expect(requestLogs.length).toBeGreaterThan(0);
    for (const entry of requestLogs) {
      expect(entry).not.toContain("secret123");
      expect(entry).not.toContain("test@kaist.ac.kr");
    }

    consoleSpy.mockRestore();
  });
});
