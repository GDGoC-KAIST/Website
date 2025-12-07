import request from "supertest";
import {Timestamp} from "firebase-admin/firestore";
import {setupTestEnv, teardownTestEnv} from "./setup";
import {createTestApp} from "./appFactory";
import {clearCollections} from "../helpers/firestoreCleanup";
import {
  seedRecruitApplication,
  seedRecruitConfig,
  seedRecruitSession,
} from "../helpers/recruitSeed";
import {hashPassword} from "../../src/utils/security";
import {db} from "../../src/config/firebase";

let app = createTestApp();
const OUTBOX = "recruitOutbox";

beforeAll(async () => {
  await setupTestEnv();
  app = createTestApp();
});

beforeEach(async () => {
  await clearCollections(["recruitApplications", "recruitSessions", "recruitConfig", OUTBOX]);
});

afterAll(async () => {
  await teardownTestEnv();
});

describe("Recruit outbox integration", () => {
  it("enqueues application confirmation email", async () => {
    await seedRecruitConfig(true);
    const payload = {
      name: "Outbox User",
      kaistEmail: "outbox@kaist.ac.kr",
      googleEmail: "outbox@example.com",
      phone: "010-0000-0000",
      department: "CS",
      studentId: "20240002",
      motivation: "Test",
      experience: "Test",
      wantsToDo: "Backend",
      password: "StrongPass123!",
    };

    await request(app).post("/v2/recruit/applications").send(payload).expect(201);

    const snapshot = await db.collection(OUTBOX).get();
    expect(snapshot.size).toBe(1);
    const doc = snapshot.docs[0].data();
    expect(doc.type).toBe("recruit.applicationReceived");
    expect(doc.to).toBe(payload.googleEmail);
    expect(doc.status).toBe("pending");
    expect(doc.payload).toHaveProperty("html");
  });

  it("enqueues temp password email on lockout", async () => {
    const email = "lockout@kaist.ac.kr";
    const passwordHash = await hashPassword("Locked123!");
    await seedRecruitApplication(email, passwordHash);

    // Trigger lockout (first 9 attempts return 401)
    for (let i = 0; i < 9; i++) {
      await request(app)
        .post("/v2/recruit/login")
        .send({kaistEmail: email, password: "Wrong"})
        .expect(401);
    }

    await request(app)
      .post("/v2/recruit/login")
      .send({kaistEmail: email, password: "Wrong"})
      .expect(423);

    const snapshot = await db.collection(OUTBOX).get();
    expect(snapshot.size).toBe(1);
    const doc = snapshot.docs[0].data();
    expect(doc.type).toBe("recruit.temporaryPassword");
    expect(doc.to).toBe("test@gmail.com");
    expect(doc.status).toBe("pending");
  });

  it("allows legacy session without expiresAt", async () => {
    const email = "ttl-legacy@kaist.ac.kr";
    const passwordHash = await hashPassword("Legacy123!");
    await seedRecruitApplication(email, passwordHash);
    const {token} = await seedRecruitSession(email);

    await request(app)
      .get("/v2/recruit/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("rejects expired session and deletes it", async () => {
    const email = "ttl-expired@kaist.ac.kr";
    const passwordHash = await hashPassword("Expired123!");
    await seedRecruitApplication(email, passwordHash);
    const past = Timestamp.fromMillis(Date.now() - 60 * 1000);
    const {token} = await seedRecruitSession(email, {expiresAt: past});

    await request(app)
      .get("/v2/recruit/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(401, {error: "Unauthorized"});

    const snap = await db.collection("recruitSessions").doc(token).get();
    expect(snap.exists).toBe(false);
  });
});
