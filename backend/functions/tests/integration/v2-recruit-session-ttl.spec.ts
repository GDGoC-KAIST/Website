import request from "supertest";
import {Timestamp} from "firebase-admin/firestore";
import {setupTestEnv, teardownTestEnv} from "./setup";
import {createTestApp} from "./appFactory";
import {clearCollections} from "../helpers/firestoreCleanup";
import {seedRecruitApplication, seedRecruitSession} from "../helpers/recruitSeed";
import {hashPassword} from "../../src/utils/security";
import {db} from "../../src/config/firebase";

let app = createTestApp();
const COLLECTIONS = ["recruitApplications", "recruitSessions", "recruitConfig"];

async function seedBaseApplication(email: string) {
  const passwordHash = await hashPassword("LegacyPass123!");
  await seedRecruitApplication(email, passwordHash, {
    name: "TTL Tester",
    googleEmail: "ttl.tester@gmail.com",
  });
}

describe("Recruit Session TTL", () => {
  beforeAll(async () => {
    await setupTestEnv();
    app = createTestApp();
  });

  beforeEach(async () => {
    await clearCollections(COLLECTIONS);
  });

  afterAll(async () => {
    await teardownTestEnv();
  });

  it("allows sessions with future expiresAt", async () => {
    const email = "future@kaist.ac.kr";
    await seedBaseApplication(email);
    const future = Timestamp.fromMillis(Date.now() + 10 * 60 * 1000);
    const {token} = await seedRecruitSession(email, {expiresAt: future});

    await request(app)
      .get("/v2/recruit/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("allows legacy sessions without expiresAt", async () => {
    const email = "legacy@kaist.ac.kr";
    await seedBaseApplication(email);
    const {token} = await seedRecruitSession(email);

    await request(app)
      .get("/v2/recruit/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("rejects expired sessions and deletes them", async () => {
    const email = "expired@kaist.ac.kr";
    await seedBaseApplication(email);
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
