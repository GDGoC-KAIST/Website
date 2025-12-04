import request from "supertest";
import admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "./setup";
import type {Role} from "../../src/types/auth";
import {createTestApp} from "./appFactory";

jest.setTimeout(60000);

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
let fetchSpy: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>;
let app: ReturnType<typeof createTestApp>;
const basicContent = buildContent("Hello world");

beforeAll(async () => {
  await setupTestEnv();
  app = createTestApp();
  fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
});

beforeEach(async () => {
  await clearFirestore();
  fetchMock.mockReset();
});

afterAll(async () => {
  fetchSpy.mockRestore();
  await teardownTestEnv();
});

describe("V2 Integration Flow", () => {
  it("handles auth flow with refresh rotation", async () => {
    const login = await loginWithGithubProfile({
      id: 1001,
      login: "tester",
      email: "tester@example.com",
      name: "Tester",
    });

    const userId = login.user.id;
    expect(userId).toBe("1001");
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    expect(userDoc.exists).toBe(true);

    const firstRotation = await request(app)
      .post("/v2/auth/refresh")
      .send({refreshToken: login.refreshToken})
      .expect(200);

    await request(app)
      .get("/v2/users/me")
      .set("Authorization", `Bearer ${firstRotation.body.accessToken}`)
      .expect(200);

    const secondRotation = await request(app)
      .post("/v2/auth/refresh")
      .send({refreshToken: firstRotation.body.refreshToken})
      .expect(200);

    expect(secondRotation.body.refreshToken).toBeDefined();
    expect(secondRotation.body.refreshToken).not.toBe(firstRotation.body.refreshToken);

    await request(app).post("/v2/auth/refresh").send({refreshToken: login.refreshToken}).expect(401);
  });

  it("revokes all sessions on refresh token reuse", async () => {
    const login = await loginWithGithubProfile({
      id: 1002,
      login: "reuse-detect",
      email: "reuse@example.com",
      name: "Reuse",
    });

    const rotation = await request(app)
      .post("/v2/auth/refresh")
      .send({refreshToken: login.refreshToken})
      .expect(200);

    const reuseAttempt = await request(app)
      .post("/v2/auth/refresh")
      .send({refreshToken: login.refreshToken})
      .expect(401);

    expect(reuseAttempt.body.error?.code).toBe("REFRESH_REUSE_DETECTED");

    await request(app)
      .post("/v2/auth/refresh")
      .send({refreshToken: rotation.body.refreshToken})
      .expect(401);
  });

  it("supports logout for current or all sessions", async () => {
    const single = await loginWithGithubProfile({
      id: 1003,
      login: "logout-user",
      email: "logout@example.com",
      name: "Logout",
    });

    await request(app)
      .post("/v2/auth/logout")
      .set("Authorization", `Bearer ${single.accessToken}`)
      .expect(200);

    await request(app).post("/v2/auth/refresh").send({refreshToken: single.refreshToken}).expect(401);

    const multiDeviceFirst = await loginWithGithubProfile({
      id: 1004,
      login: "logout-multi",
      email: "logout-multi@example.com",
      name: "Logout Multi",
    });
    const multiDeviceSecond = await loginWithGithubProfile({
      id: 1004,
      login: "logout-multi",
      email: "logout-multi@example.com",
      name: "Logout Multi",
    });

    await request(app)
      .post("/v2/auth/logout?all=true")
      .set("Authorization", `Bearer ${multiDeviceFirst.accessToken}`)
      .expect(200);

    await request(app)
      .post("/v2/auth/refresh")
      .send({refreshToken: multiDeviceFirst.refreshToken})
      .expect(401);

    await request(app)
      .post("/v2/auth/refresh")
      .send({refreshToken: multiDeviceSecond.refreshToken})
      .expect(401);
  });

  it("links a member via link code", async () => {
    const adminHeaders = createAuthHeaders("admin-user", ["ADMIN"]);
    const memberResponse = await request(app)
      .post("/v2/admin/members")
      .set(adminHeaders)
      .send({
        name: "Alice",
        studentId: "S12345",
        department: "CS",
        generation: 1,
        role: "Member",
      })
      .expect(201);

    const {linkCode, member} = memberResponse.body;
    expect(linkCode).toBeDefined();

    const login = await loginWithGithubProfile({
      id: 2002,
      login: "linker",
      email: "linker@example.com",
      name: "Linker",
    });

    await request(app)
      .post("/v2/users/link-member")
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({linkCode})
      .expect(200);

    const userDoc = await admin.firestore().collection("users").doc(login.user.id).get();
    expect(userDoc.data()?.memberId).toBe(member.id);
    expect(userDoc.data()?.roles).toContain("MEMBER");

    const memberDoc = await admin.firestore().collection("members").doc(member.id).get();
    expect(memberDoc.data()?.userId).toBe(login.user.id);
  });

  it("runs content lifecycle (post/comment/like) and updates counters", async () => {
    const posterId = "poster-1";
    await seedUser(posterId, ["MEMBER"]);
    const memberHeaders = createAuthHeaders(posterId, ["MEMBER"]);

    const postResponse = await request(app)
      .post("/v2/posts")
      .set(memberHeaders)
      .send({
        type: "blog",
        title: "Test Post",
        content: basicContent,
      })
      .expect(201);

    const postId = postResponse.body.post.id;

    const commenterId = "commenter-1";
    await seedUser(commenterId, ["USER"]);
    const commenterHeaders = createAuthHeaders(commenterId, ["USER"]);

    await request(app)
      .post("/v2/comments")
      .set(commenterHeaders)
      .send({
        targetType: "post",
        targetId: postId,
        content: "Nice!",
      })
      .expect(201);

    await request(app)
      .post("/v2/likes/toggle")
      .set(commenterHeaders)
      .send({
        targetType: "post",
        targetId: postId,
      })
      .expect(200);

    const postDoc = await admin.firestore().collection("posts").doc(postId).get();
    expect(postDoc.data()?.commentCount).toBe(1);
    expect(postDoc.data()?.likeCount).toBe(1);
  });

  it("enforces security guards for resource access", async () => {
    const ownerId = "owner-1";
    const intruderId = "intruder-1";
    await seedUser(ownerId, ["MEMBER"]);
    await seedUser(intruderId, ["USER"]);

    const postResponse = await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(ownerId, ["MEMBER"]))
      .send({
        type: "blog",
        title: "Owner Post",
        content: buildContent("Secret"),
      })
      .expect(201);

    const postId = postResponse.body.post.id;

    await request(app)
      .delete(`/v2/posts/${postId}`)
      .set(createAuthHeaders(intruderId, ["USER"]))
      .expect(403);

    await request(app)
      .post("/v2/admin/members")
      .set(createAuthHeaders("regular-user", ["USER"]))
      .send({
        name: "Bob",
        studentId: "S222",
        department: "EE",
        generation: 1,
        role: "Member",
      })
      .expect(403);
  });

  it("sanitizes unsafe links in post content", async () => {
    const memberId = "sanitize-member";
    await seedUser(memberId, ["MEMBER"]);
    const malicious = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Click me",
              marks: [
                {
                  type: "link",
                  attrs: {href: "javascript:alert(1)"},
                },
              ],
            },
          ],
        },
      ],
    };

    const response = await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(memberId, ["MEMBER"]))
      .send({
        type: "blog",
        title: "Unsafe",
        content: malicious,
      })
      .expect(201);

    const postId = response.body.post.id;
    const saved = await admin.firestore().collection("posts").doc(postId).get();
    const savedContent = saved.data()?.content;
    const marks = savedContent?.content?.[0]?.content?.[0]?.marks;
    expect(marks).toBeUndefined();
  });

  it("coerces string content into tiptap doc", async () => {
    const memberId = "string-content";
    await seedUser(memberId, ["MEMBER"]);
    const textBody = "String body";
    const response = await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(memberId, ["MEMBER"]))
      .send({
        type: "blog",
        title: "String Post",
        content: textBody,
      })
      .expect(201);

    const postId = response.body.post.id;
    const stored = await admin.firestore().collection("posts").doc(postId).get();
    const storedText = stored.data()?.content?.content?.[0]?.content?.[0]?.text;
    expect(storedText).toBe(textBody);
  });

  it("returns stable etags for posts", async () => {
    const memberId = "etag-member";
    await seedUser(memberId, ["MEMBER"]);
    const createRes = await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(memberId, ["MEMBER"]))
      .send({
        type: "blog",
        title: "ETag Test",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{type: "text", text: "stable"}],
            },
          ],
        },
      })
      .expect(201);

    const postId = createRes.body.post.id;
    const first = await request(app).get(`/v2/posts/${postId}`).expect(200);
    const etag = first.headers["etag"];
    expect(etag).toBeDefined();

    const repeat = await request(app).get(`/v2/posts/${postId}`).expect(200);
    expect(repeat.headers["etag"]).toBe(etag);

    await request(app).get(`/v2/posts/${postId}`).set("If-None-Match", etag).expect(304);

    await request(app)
      .patch(`/v2/posts/${postId}`)
      .set(createAuthHeaders(memberId, ["MEMBER"]))
      .send({
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{type: "text", foo: "bar", text: "stable"}],
            },
          ],
        },
      })
      .expect(200);

    const second = await request(app).get(`/v2/posts/${postId}`).expect(200);
    expect(second.headers["etag"]).toBe(etag);
  });

  it("searches posts by query", async () => {
    const memberId = "search-member";
    await seedUser(memberId, ["MEMBER"]);
    await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(memberId, ["MEMBER"]))
      .send({
        type: "blog",
        title: "SearchTitle",
        tags: ["UniqueTag"],
        content: buildContent("Searchable content"),
      })
      .expect(201);

    const search = await request(app).get("/v2/posts?q=UniqueTag").expect(200);
    expect(search.body.posts.length).toBeGreaterThan(0);
  });

  it("includes excerpt and readingTime", async () => {
    const memberId = "excerpt-member";
    await seedUser(memberId, ["MEMBER"]);
    const response = await request(app)
      .post("/v2/posts")
      .set(createAuthHeaders(memberId, ["MEMBER"]))
      .send({
        type: "blog",
        title: "Excerpt Title",
        content: buildContent("Excerpt content"),
      })
      .expect(201);

    expect(response.body.post.excerpt).toContain("Excerpt content");
    expect(response.body.post.readingTime).toBeGreaterThan(0);
  });

  it("runs recruit acceptance pipeline and creates member with link code", async () => {
    const adminHeaders = createAuthHeaders("admin-recruit", ["ADMIN"]);
    const applicationId = "app-" + Date.now();
    await admin.firestore().collection("recruitApplications").doc(applicationId).set({
      name: "Recruit Tester",
      email: "recruit@example.com",
      phone: "010-0000-0000",
      department: "CS",
      studentId: "20231234",
      semester: "2024-Fall",
      answers: {},
      status: "pending",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const response = await request(app)
      .patch(`/v2/admin/recruit/applications/${applicationId}/status`)
      .set(adminHeaders)
      .send({
        status: "accepted",
        generation: 12,
      })
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.memberId).toBeDefined();
    expect(response.body.linkCode).toBeTruthy();

    const memberId = response.body.memberId as string;
    const memberDoc = await admin.firestore().collection("members").doc(memberId).get();
    expect(memberDoc.exists).toBe(true);
    expect(memberDoc.data()?.name).toBe("Recruit Tester");

    const applicationDoc = await admin.firestore().collection("recruitApplications").doc(applicationId).get();
    expect(applicationDoc.data()?.acceptedMemberId).toBe(memberId);
    expect(applicationDoc.data()?.status).toBe("accepted");
  });
});

async function seedUser(userId: string, roles: Role[]) {
  await admin.firestore().collection("users").doc(userId).set({
    githubId: userId,
    githubUsername: `user-${userId}`,
    email: `${userId}@example.com`,
    name: `User ${userId}`,
    roles,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

async function loginWithGithubProfile(profile: {
  id: number;
  login: string;
  email: string;
  name: string;
}) {
  mockGithub(profile);
  const response = await request(app)
    .post("/v2/auth/login/github")
    .send({githubAccessToken: `token-${profile.id}`})
    .expect(200);
  return response.body;
}

function mockGithub(profile: {id: number; login: string; email: string; name: string}) {
  fetchMock.mockImplementation((input) => {
    const url =
      typeof input === "string"
        ? input
        : typeof (input as {url?: string})?.url === "string"
          ? (input as {url: string}).url
          : String(input);
    if (url.endsWith("/user")) {
      return Promise.resolve(
        createFetchResponse({
          id: profile.id,
          login: profile.login,
          email: profile.email,
          name: profile.name,
          avatar_url: "https://example.com/avatar.png",
        })
      );
    }
    if (url.endsWith("/user/emails")) {
      return Promise.resolve(
        createFetchResponse([{email: profile.email, primary: true, verified: true}])
      );
    }
    return Promise.resolve(createFetchResponse({}, 404));
  });
}

function createFetchResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type": "application/json"},
  });
}

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
