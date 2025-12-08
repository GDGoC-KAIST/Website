import request from "supertest";

function buildApp() {
  // reload modules to pick up env changes
  jest.resetModules();
  // use require to avoid dynamic import in CommonJS test runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {createTestApp} = require("./appFactory");
  return createTestApp();
}

describe("CORS policy", () => {
  afterEach(() => {
    delete process.env.CORS_ALLOW_LOCALHOST;
    delete process.env.CORS_ORIGIN;
    process.env.NODE_ENV = "test";
    delete process.env.IP_HASH_SALT;
    delete process.env.ABUSE_GUARD_STORE;
  });

  beforeEach(() => {
    // Minimal required env for test bootstrap
    process.env.IP_HASH_SALT = "test-salt";
    process.env.ABUSE_GUARD_STORE = "firestore";
  });

  test("allows localhost in dev when enabled", async () => {
    process.env.CORS_ALLOW_LOCALHOST = "true";
    process.env.CORS_ORIGIN = "";
    process.env.NODE_ENV = "development";
    const app = await buildApp();

    const res = await request(app)
      .get("/v2/healthz")
      .set("Origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("blocks unknown origins", async () => {
    process.env.CORS_ALLOW_LOCALHOST = "false";
    process.env.CORS_ORIGIN = "";
    process.env.NODE_ENV = "development";
    const app = await buildApp();

    const res = await request(app)
      .get("/v2/healthz")
      .set("Origin", "http://evil.com");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    expect(res.headers["access-control-allow-credentials"]).toBeUndefined();
  });

  test("production requires allowlist (localhost rejected)", async () => {
    process.env.CORS_ALLOW_LOCALHOST = "true";
    process.env.CORS_ORIGIN = "https://example.com";
    process.env.NODE_ENV = "production";
    const app = await buildApp();

    const res = await request(app)
      .get("/v2/healthz")
      .set("Origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
