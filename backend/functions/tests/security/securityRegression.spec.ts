import request from "supertest";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "../integration/setup";
import {createTestApp} from "../integration/appFactory";
import {seedUser, seedPost, seedImage} from "../utils/testData";

let app = createTestApp();

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

describe("Security Regression Tests", () => {
  it("PUBLIC user cannot read members-only post", async () => {
    const postId = "secure-post";
    await seedPost(postId, {visibility: "members_only"});
    await seedUser("public-user", ["USER"]);

    await request(app)
      .get(`/v2/posts/${postId}`)
      .set(createAuthHeaders("public-user", ["USER"]))
      .expect(403);
  });

  it("USER role cannot create posts", async () => {
    await seedUser("user-poster", ["USER"]);
    await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders("user-poster", ["USER"]))
      .send({type: "blog", title: "Should fail", content: "Nope"})
      .expect(403);
  });

  it("MEMBER cannot access admin endpoints", async () => {
    await seedUser("member-user", ["MEMBER"]);
    await request(app)
      .post("/v2/admin/members")
      .set(createAuthHeaders("member-user", ["MEMBER"]))
      .send({
        name: "Should Block",
        studentId: "S000",
        department: "CS",
        generation: 1,
        role: "Member",
      })
      .expect(403);
  });

  it("MEMBER cannot delete another user's image", async () => {
    await seedImage("img-1", "owner-1");
    await seedUser("owner-1", ["MEMBER"]);
    await seedUser("intruder", ["MEMBER"]);

    await request(app)
      .delete("/v2/images/img-1")
      .set(createAuthHeaders("intruder", ["MEMBER"]))
      .expect(403);
  });
});
