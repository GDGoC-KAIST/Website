import request from "supertest";
import {expect} from "@jest/globals";
import {setupTestEnv, teardownTestEnv} from "./setup";
import {createTestApp} from "./appFactory";
import {recruitApplyStore, recruitLoginStore} from "../../src/routes/v2/recruitRoutes";
import {seedRecruitConfig, seedRecruitApplication} from "../helpers/recruitSeed";
import {hashPassword} from "../../src/utils/security";
import {clearCollections} from "../helpers/firestoreCleanup";

let app = createTestApp();
const FIXED_IP = "192.168.1.100";
const originalEnv = process.env.NODE_ENV;

beforeAll(async () => {
  await setupTestEnv();
  app = createTestApp();
});

beforeEach(async () => {
  await clearCollections(["recruitApplications", "recruitSessions", "recruitConfig"]);
  // Reset rate limit stores
  recruitApplyStore.resetAll();
  recruitLoginStore.resetAll();
  // Enable rate limiting by temporarily changing NODE_ENV
  process.env.NODE_ENV = "production";
});

afterEach(() => {
  // Restore NODE_ENV
  process.env.NODE_ENV = originalEnv;
});

afterAll(async () => {
  await teardownTestEnv();
});

describe("Recruit Rate Limiting (Isolated Tests)", () => {
  describe("POST /v2/recruit/applications rate limit", () => {
    const validApplication = {
      name: "Test User",
      kaistEmail: "ratelimit@kaist.ac.kr",
      googleEmail: "test@gmail.com",
      phone: "010-1234-5678",
      department: "Computer Science",
      studentId: "20240001",
      motivation: "I want to learn",
      experience: "Built apps",
      wantsToDo: "Work on projects",
      password: "SecurePass123!",
    };

    beforeEach(async () => {
      await seedRecruitConfig(true);
      recruitApplyStore.resetKey(FIXED_IP);
    });

    it("should allow 5 requests and reject the 6th with 429", async () => {
      const timestamp = Date.now();

      // First 5 requests should succeed (201) - use unique emails
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post("/v2/recruit/applications")
          .set("X-Forwarded-For", FIXED_IP)
          .send({...validApplication, kaistEmail: `test-${timestamp}-${i}@kaist.ac.kr`})
          .expect(201);

        expect(response.body).toHaveProperty("success", true);
      }

      // 6th request should be rate limited (429)
      const rateLimitedResponse = await request(app)
        .post("/v2/recruit/applications")
        .set("X-Forwarded-For", FIXED_IP)
        .send({...validApplication, kaistEmail: `test-${timestamp}-6@kaist.ac.kr`})
        .expect(429);

      // Verify legacy error format
      expect(rateLimitedResponse.body).toEqual({error: "Too many requests"});
      expect(rateLimitedResponse.headers["retry-after"]).toBeDefined();
    });

    it("should reset after clearing the store", async () => {
      const timestamp = Date.now();

      // Exhaust the limit with unique emails
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/v2/recruit/applications")
          .set("X-Forwarded-For", FIXED_IP)
          .send({...validApplication, kaistEmail: `exhaust-${timestamp}-${i}@kaist.ac.kr`});
      }

      // Reset the store
      recruitApplyStore.resetKey(FIXED_IP);

      // Should work again with unique email
      const response = await request(app)
        .post("/v2/recruit/applications")
        .set("X-Forwarded-For", FIXED_IP)
        .send({...validApplication, kaistEmail: `afterreset-${timestamp}@kaist.ac.kr`})
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
    });
  });

  describe("POST /v2/recruit/login rate limit", () => {
    const testPassword = "TestPassword123!";

    beforeEach(async () => {
      recruitLoginStore.resetKey(FIXED_IP);
    });

    it("should allow 20 requests and reject the 21st with 429", async () => {
      const timestamp = Date.now();
      const passwordHash = await hashPassword(testPassword);

      // Create 21 different applications to avoid account lockout
      for (let i = 0; i < 21; i++) {
        await seedRecruitApplication(`login-${timestamp}-${i}@kaist.ac.kr`, passwordHash);
      }

      // First 20 requests should succeed or fail auth (200 or 401), but not rate limited
      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .post("/v2/recruit/login")
          .set("X-Forwarded-For", FIXED_IP)
          .send({kaistEmail: `login-${timestamp}-${i}@kaist.ac.kr`, password: testPassword});
        // Should succeed (200) since we're using correct password
        expect([200, 401]).toContain(response.status);
      }

      // 21st request should be rate limited (429)
      const rateLimitedResponse = await request(app)
        .post("/v2/recruit/login")
        .set("X-Forwarded-For", FIXED_IP)
        .send({kaistEmail: `login-${timestamp}-20@kaist.ac.kr`, password: testPassword})
        .expect(429);

      // Verify legacy error format
      expect(rateLimitedResponse.body).toEqual({error: "Too many requests"});
      expect(rateLimitedResponse.headers["retry-after"]).toBeDefined();
    });

    it("should not affect different IPs", async () => {
      const timestamp = Date.now();
      const IP_1 = "192.168.1.1";
      const IP_2 = "192.168.1.2";
      const passwordHash = await hashPassword(testPassword);

      // Create 21 applications for IP_1 tests
      for (let i = 0; i < 21; i++) {
        await seedRecruitApplication(`ip1-${timestamp}-${i}@kaist.ac.kr`, passwordHash);
      }

      // Create 1 application for IP_2 test
      await seedRecruitApplication(`ip2-${timestamp}@kaist.ac.kr`, passwordHash);

      // Exhaust limit for IP_1 (use correct password to get 200, not 401)
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post("/v2/recruit/login")
          .set("X-Forwarded-For", IP_1)
          .send({kaistEmail: `ip1-${timestamp}-${i}@kaist.ac.kr`, password: testPassword});
      }

      // IP_1 should be rate limited
      await request(app)
        .post("/v2/recruit/login")
        .set("X-Forwarded-For", IP_1)
        .send({kaistEmail: `ip1-${timestamp}-20@kaist.ac.kr`, password: testPassword})
        .expect(429);

      // IP_2 should still work (different IP counter)
      const response = await request(app)
        .post("/v2/recruit/login")
        .set("X-Forwarded-For", IP_2)
        .send({kaistEmail: `ip2-${timestamp}@kaist.ac.kr`, password: testPassword})
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("token");
    });
  });
});
