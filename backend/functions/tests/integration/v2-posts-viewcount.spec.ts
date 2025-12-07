import request from "supertest";
import admin from "firebase-admin";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";
import {seedPost} from "../utils/testData";

let app: ReturnType<typeof createTestApp>;

function buildContent(text: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
          },
        ],
      },
    ],
  };
}

beforeAll(async () => {
  await setupTestEnv();
  app = createTestApp();
});

beforeEach(async () => {
  await clearFirestore();
});

afterAll(async () => {
  await teardownTestEnv();
});

describe("GET /v2/posts/:postId viewCount behavior", () => {
  it("increments viewCount on each 200 response", async () => {
    const postId = "view-count-200";
    await seedPost(postId, {content: buildContent("Hello 200")});

    const first = await request(app)
      .get(`/v2/posts/${postId}`)
      .expect(200);
    expect(first.body.post.viewCount).toBe(1);

    const second = await request(app)
      .get(`/v2/posts/${postId}`)
      .expect(200);
    expect(second.body.post.viewCount).toBe(2);
  });

  it("does not increment viewCount when request returns 304", async () => {
    const postId = "view-count-304";
    await seedPost(postId, {content: buildContent("Hello 304")});

    const success = await request(app)
      .get(`/v2/posts/${postId}`)
      .expect(200);
    expect(success.body.post.viewCount).toBe(1);
    const etag = success.headers.etag;
    expect(etag).toBeDefined();

    await request(app)
      .get(`/v2/posts/${postId}`)
      .set("If-None-Match", etag)
      .expect(304);

    const snapshot = await admin.firestore().collection("posts").doc(postId).get();
    expect(snapshot.data()?.viewCount).toBe(1);

    const nextHit = await request(app)
      .get(`/v2/posts/${postId}`)
      .expect(200);
    expect(nextHit.body.post.viewCount).toBe(2);
  });
});
