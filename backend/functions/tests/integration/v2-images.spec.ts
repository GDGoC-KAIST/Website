import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "./setup";
import {clearStorageBucket} from "../helpers/storageCleanup";

let app = createTestApp();

// 1x1 PNG (base64). Keeps upload pipeline happy and avoids sharp/busboy errors.
const PNG_1x1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2xQAAAAASUVORK5CYII=";
const fileBuffer = Buffer.from(PNG_1x1, "base64");

if (!process.env.FIREBASE_STORAGE_BUCKET) {
  process.env.FIREBASE_STORAGE_BUCKET = "demo-test.appspot.com";
}

beforeAll(async () => {
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

describe("V2 Images", () => {
  const memberAuth = () => createAuthHeaders("image-user", ["MEMBER"]);

  describe("Upload -> Get -> Delete flow", () => {
    it("uploads, fetches, deletes, and returns 404 after deletion", async () => {
      const uploadRes = await request(app)
        .post("/v2/images")
        .set(memberAuth())
        .attach("file", fileBuffer, {filename: "test.png", contentType: "image/png"})
        .field("name", "Test Image")
        .expect(201);

      const imageId = uploadRes.body.image?.id;
      expect(typeof imageId).toBe("string");
      expect(uploadRes.body.image).toHaveProperty("url");
      expect(uploadRes.body.image).toHaveProperty("storagePath");

      const getRes = await request(app)
        .get(`/v2/images/${imageId}`)
        .set(memberAuth())
        .expect(200);

      if (getRes.status === 403) {
        // Surface body to help diagnose scope/auth mismatches during manual runs
        // eslint-disable-next-line no-console
        console.log("DEBUG 403 BODY:", JSON.stringify(getRes.body));
      }

      expect(getRes.body.image.id).toBe(imageId);

      await request(app)
        .delete(`/v2/images/${imageId}`)
        .set(memberAuth())
        .expect(200, {ok: true});

      const afterDelete = await request(app)
        .get(`/v2/images/${imageId}`)
        .set(memberAuth())
        .expect(404);

      expect(typeof afterDelete.body.error).toBe("object");
      expect(afterDelete.body.error).toHaveProperty("code");
      expect(afterDelete.body.error).toHaveProperty("message");
    });
  });

  describe("Error cases", () => {
    it("rejects upload without auth", async () => {
      const res = await request(app)
        .post("/v2/images")
        .attach("file", fileBuffer, {filename: "noauth.png", contentType: "image/png"})
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects upload without file", async () => {
      const res = await request(app)
        .post("/v2/images")
        .set(memberAuth())
        .field("name", "No file")
        .expect(400);

      expect(res.body.error.code).toBe("INVALID_INPUT");
    });

    it("rejects delete of non-existent image", async () => {
      const res = await request(app)
        .delete("/v2/images/nonexistent")
        .set(memberAuth())
        .expect(404);

      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
