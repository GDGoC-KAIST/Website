import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore, createAuthHeaders} from "./setup";
import {getAdminAuthHeaders, seedMemberDoc, getStoredLinkCode, hashLinkCodeForTest} from "../helpers/adminSeed";

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

describe("Admin reset-link-code", () => {
  const memberId = "member-1";
  const adminHeaders = getAdminAuthHeaders();
  const userHeaders = createAuthHeaders("regular-user", ["USER"]);

  async function expectHashMatches(linkCode: string, targetMemberId: string) {
    const stored = await getStoredLinkCode(targetMemberId);
    expect(stored).toBeDefined();
    expect(stored?.linkCodeHash).toBe(hashLinkCodeForTest(linkCode));
  }

  describe("happy path", () => {
    it("creates a new link code", async () => {
      await seedMemberDoc(memberId);

      const res = await request(app)
        .post(`/v2/admin/members/${memberId}/reset-link-code`)
        .set(adminHeaders)
        .send({expiresInDays: 5})
        .expect(200);

      expect(typeof res.body.linkCode).toBe("string");
      await expectHashMatches(res.body.linkCode, memberId);
    });

    it("overwrites previous link code", async () => {
      await seedMemberDoc(memberId);

      const first = await request(app)
        .post(`/v2/admin/members/${memberId}/reset-link-code`)
        .set(adminHeaders)
        .send({expiresInDays: 5})
        .expect(200);

      const second = await request(app)
        .post(`/v2/admin/members/${memberId}/reset-link-code`)
        .set(adminHeaders)
        .send({expiresInDays: 7})
        .expect(200);

      expect(second.body.linkCode).not.toBe(first.body.linkCode);
      await expectHashMatches(second.body.linkCode, memberId);
    });
  });

  describe("error cases", () => {
    it("rejects without auth", async () => {
      const res = await request(app)
        .post(`/v2/admin/members/${memberId}/reset-link-code`)
        .send({expiresInDays: 5})
        .expect(401);

      expect(res.body).toEqual({error: expect.any(String)});
    });

    it("rejects non-admin user", async () => {
      const res = await request(app)
        .post(`/v2/admin/members/${memberId}/reset-link-code`)
        .set(userHeaders)
        .send({expiresInDays: 5})
        .expect(403);

      expect(res.body).toEqual({error: expect.any(String)});
    });

    it("rejects empty body", async () => {
      await seedMemberDoc(memberId);

      const res = await request(app)
        .post(`/v2/admin/members/${memberId}/reset-link-code`)
        .set(adminHeaders)
        .send({})
        .expect(400);

      expect(res.body).toEqual({error: expect.any(String)});
    });

    it("rejects invalid type", async () => {
      await seedMemberDoc(memberId);

      const res = await request(app)
        .post(`/v2/admin/members/${memberId}/reset-link-code`)
        .set(adminHeaders)
        .send({expiresInDays: "abc"})
        .expect(400);

      expect(res.body).toEqual({error: expect.any(String)});
    });

    it("rejects negative expiresInDays", async () => {
      await seedMemberDoc(memberId);

      const res = await request(app)
        .post(`/v2/admin/members/${memberId}/reset-link-code`)
        .set(adminHeaders)
        .send({expiresInDays: -1})
        .expect(400);

      expect(res.body).toEqual({error: expect.any(String)});
    });

    it("404 when member missing", async () => {
      const res = await request(app)
        .post(`/v2/admin/members/does-not-exist/reset-link-code`)
        .set(adminHeaders)
        .send({expiresInDays: 5})
        .expect(404);

      expect(res.body).toEqual({error: expect.any(String)});
    });
  });
});
