import request from "supertest";
import admin from "firebase-admin";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";
import {createTestApp} from "./appFactory";
import {seedUser, authHeaderForUser} from "../helpers/userSeed";

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

describe("PATCH /v2/users/me", () => {
  it("updates allowed fields", async () => {
    const userId = "user-update-success";
    await seedUser(userId, {name: "Original", phone: "010-1111-1111"});

    const res = await request(app)
      .patch("/v2/users/me")
      .set(authHeaderForUser(userId))
      .send({name: "Updated Name", phone: "010-2222-2222"})
      .expect(200);

    expect(res.body.user.name).toBe("Updated Name");
    const doc = await admin.firestore().collection("users").doc(userId).get();
    expect(doc.data()?.phone).toBe("010-2222-2222");
  });

  it("updates department only", async () => {
    const userId = "user-update-dept";
    await seedUser(userId, {department: "EE"});

    const res = await request(app)
      .patch("/v2/users/me")
      .set(authHeaderForUser(userId))
      .send({department: "Mathematics"})
      .expect(200);

    expect(res.body.user.department).toBe("Mathematics");
    const doc = await admin.firestore().collection("users").doc(userId).get();
    expect(doc.data()?.department).toBe("Mathematics");
  });

  it("rejects missing auth", async () => {
    const res = await request(app)
      .patch("/v2/users/me")
      .send({name: "Hacker"})
      .expect(401);

    expect(res.body.error).toMatchObject({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  });

  it("rejects empty body", async () => {
    const userId = "user-empty-body";
    await seedUser(userId);

    const res = await request(app)
      .patch("/v2/users/me")
      .set(authHeaderForUser(userId))
      .send({})
      .expect(400);

    expect(res.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "No fields to update",
    });
  });

  it("rejects role changes", async () => {
    const userId = "user-role-change";
    await seedUser(userId);

    const res = await request(app)
      .patch("/v2/users/me")
      .set(authHeaderForUser(userId))
      .send({role: "admin"})
      .expect(403);

    expect(res.body.error).toMatchObject({
      code: "FORBIDDEN",
      message: "Cannot update restricted fields",
    });

    const doc = await admin.firestore().collection("users").doc(userId).get();
    expect(doc.data()?.roles).toEqual(["USER"]);
  });

  it("rejects type mismatches", async () => {
    const userId = "user-type-mismatch";
    await seedUser(userId);

    const res = await request(app)
      .patch("/v2/users/me")
      .set(authHeaderForUser(userId))
      .send({phone: 12345})
      .expect(400);

    expect(res.body.error).toMatchObject({
      code: "INVALID_INPUT",
      message: "Invalid field: phone",
    });
  });
});
