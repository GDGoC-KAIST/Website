import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "./setup";
import {clearStorageBucket} from "../helpers/storageCleanup";

let app = createTestApp();

const memberAuth = () => createAuthHeaders("image-validator", ["MEMBER"]);
const PNG_1x1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2xQAAAAASUVORK5CYII=";
const smallPng = Buffer.from(PNG_1x1, "base64");

beforeAll(async () => {
  process.env.FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || "demo-test.appspot.com";
  await setupTestEnv();
  app = createTestApp();
});

afterEach(async () => {
  await clearFirestore();
  await clearStorageBucket();
});

afterAll(async () => {
  await teardownTestEnv();
});

describe("V2 Image validation", () => {
  it("rejects files larger than 5MB", async () => {
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);

    const res = await request(app)
      .post("/v2/images")
      .set(memberAuth())
      .attach("file", bigBuffer, {filename: "too-big.png", contentType: "image/png"})
      .expect(413);

    expect(res.body.error).toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
      message: expect.stringContaining("5MB"),
    });
  });

  it("rejects unsupported mime types", async () => {
    const res = await request(app)
      .post("/v2/images")
      .set(memberAuth())
      .attach("file", Buffer.from("text content"), {filename: "notes.txt", contentType: "text/plain"})
      .expect(400);

    expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("accepts valid png uploads", async () => {
    const res = await request(app)
      .post("/v2/images")
      .set(memberAuth())
      .attach("file", smallPng, {filename: "ok.png", contentType: "image/png"})
      .expect(201);

    expect(res.body.image).toBeDefined();
    expect(res.body.image.id).toBeTruthy();
  });
});
