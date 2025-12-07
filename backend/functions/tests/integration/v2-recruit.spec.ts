import request from "supertest";
import {expect} from "@jest/globals";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";
import {createTestApp} from "./appFactory";
import {
  seedRecruitSession,
  seedRecruitApplication,
  seedRecruitConfig,
} from "../helpers/recruitSeed";
import {hashPassword} from "../../src/utils/security";

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

describe("Recruit V2 Endpoints", () => {
  describe("POST /v2/recruit/applications", () => {
    const validApplication = {
      name: "Test User",
      kaistEmail: "test@kaist.ac.kr",
      googleEmail: "test@gmail.com",
      phone: "010-1234-5678",
      department: "Computer Science",
      studentId: "20240001",
      motivation: "I want to learn web development",
      experience: "Built a todo app",
      wantsToDo: "Work on backend projects",
      password: "SecurePass123!",
    };

    it("should create a new application successfully", async () => {
      await seedRecruitConfig(true); // Open for applications

      const response = await request(app)
        .post("/v2/recruit/applications")
        .send(validApplication)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
    });

    it("should reject duplicate applications", async () => {
      await seedRecruitConfig(true);
      const passwordHash = await hashPassword(validApplication.password);
      await seedRecruitApplication(validApplication.kaistEmail, passwordHash);

      const response = await request(app)
        .post("/v2/recruit/applications")
        .send(validApplication)
        .expect(409);

      expect(response.body).toEqual({error: "Application already exists"});
    });

    it("should reject when recruiting is closed", async () => {
      await seedRecruitConfig(false); // Closed

      const response = await request(app)
        .post("/v2/recruit/applications")
        .send(validApplication)
        .expect(403);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject missing required fields", async () => {
      await seedRecruitConfig(true);
      const {password, ...incomplete} = validApplication;

      const response = await request(app)
        .post("/v2/recruit/applications")
        .send(incomplete)
        .expect(400);

      expect(response.body).toEqual({error: "Missing required field: password"});
    });

    it("should normalize email addresses", async () => {
      await seedRecruitConfig(true);

      const response = await request(app)
        .post("/v2/recruit/applications")
        .send({...validApplication, kaistEmail: "  TEST@KAIST.AC.KR  "})
        .expect(200);

      expect(response.body).toHaveProperty("success", true);

      // Try to create duplicate with different casing
      const duplicate = await request(app)
        .post("/v2/recruit/applications")
        .send({...validApplication, kaistEmail: "test@KAIST.ac.kr"})
        .expect(409);

      expect(duplicate.body).toEqual({error: "Application already exists"});
    });
  });

  describe("POST /v2/recruit/login", () => {
    const testEmail = "applicant@kaist.ac.kr";
    const testPassword = "TestPassword123!";

    beforeEach(async () => {
      const passwordHash = await hashPassword(testPassword);
      await seedRecruitApplication(testEmail, passwordHash);
    });

    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/v2/recruit/login")
        .send({kaistEmail: testEmail, password: testPassword})
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it("should reject wrong password", async () => {
      const response = await request(app)
        .post("/v2/recruit/login")
        .send({kaistEmail: testEmail, password: "WrongPassword123!"})
        .expect(401);

      expect(response.body).toEqual({error: "Invalid credentials"});
    });

    it("should reject non-existent email", async () => {
      const response = await request(app)
        .post("/v2/recruit/login")
        .send({kaistEmail: "nonexistent@kaist.ac.kr", password: testPassword})
        .expect(401);

      expect(response.body).toEqual({error: "Invalid credentials"});
    });

    it("should reject missing credentials", async () => {
      const response = await request(app)
        .post("/v2/recruit/login")
        .send({kaistEmail: testEmail})
        .expect(400);

      expect(response.body).toEqual({error: "kaistEmail and password are required"});
    });

    it("should normalize email during login", async () => {
      const response = await request(app)
        .post("/v2/recruit/login")
        .send({kaistEmail: "  APPLICANT@KAIST.AC.KR  ", password: testPassword})
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("token");
    });

    it("should lock account after 10 failed attempts", async () => {
      // Make 10 failed login attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post("/v2/recruit/login")
          .send({kaistEmail: testEmail, password: "WrongPassword"})
          .expect(401);
      }

      // 11th attempt should be locked
      const response = await request(app)
        .post("/v2/recruit/login")
        .send({kaistEmail: testEmail, password: "WrongPassword"})
        .expect(423);

      expect(response.body.error).toContain("Account locked");
    });
  });

  describe("GET /v2/recruit/me", () => {
    const testEmail = "me@kaist.ac.kr";

    it("should return profile when authenticated", async () => {
      const passwordHash = await hashPassword("password123");
      await seedRecruitApplication(testEmail, passwordHash, {
        name: "John Doe",
        department: "Computer Science",
      });
      const {token} = await seedRecruitSession(testEmail);

      const response = await request(app)
        .get("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testEmail);
      expect(response.body).toHaveProperty("name", "John Doe");
      expect(response.body).toHaveProperty("department", "Computer Science");
      expect(response.body).not.toHaveProperty("passwordHash");
      expect(response.body).not.toHaveProperty("failedAttempts");
    });

    it("should reject when not authenticated", async () => {
      const response = await request(app)
        .get("/v2/recruit/me")
        .expect(401);

      expect(response.body).toEqual({error: "Missing authorization token"});
    });

    it("should reject with invalid token", async () => {
      const response = await request(app)
        .get("/v2/recruit/me")
        .set("Authorization", "Bearer invalid-token-12345")
        .expect(401);

      expect(response.body).toEqual({error: "Invalid or expired session"});
    });

    it("should reject with malformed Authorization header", async () => {
      const response = await request(app)
        .get("/v2/recruit/me")
        .set("Authorization", "Malformed header")
        .expect(401);

      expect(response.body).toEqual({error: "Missing authorization token"});
    });
  });

  describe("PATCH /v2/recruit/me", () => {
    const testEmail = "update@kaist.ac.kr";
    let token: string;

    beforeEach(async () => {
      await seedRecruitConfig(true); // Must be open for updates
      const passwordHash = await hashPassword("password123");
      await seedRecruitApplication(testEmail, passwordHash, {
        name: "Original Name",
        phone: "010-0000-0000",
      });
      const session = await seedRecruitSession(testEmail);
      token = session.token;
    });

    it("should update profile fields successfully", async () => {
      const response = await request(app)
        .patch("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Name",
          phone: "010-9999-9999",
          motivation: "Updated motivation",
        })
        .expect(200);

      expect(response.body).toEqual({success: true});

      // Verify the update persisted
      const getResponse = await request(app)
        .get("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.name).toBe("Updated Name");
      expect(getResponse.body.phone).toBe("010-9999-9999");
      expect(getResponse.body.motivation).toBe("Updated motivation");
    });

    it("should reject when not authenticated", async () => {
      const response = await request(app)
        .patch("/v2/recruit/me")
        .send({name: "New Name"})
        .expect(401);

      expect(response.body).toEqual({error: "Missing authorization token"});
    });

    it("should reject with no updatable fields", async () => {
      const response = await request(app)
        .patch("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body).toEqual({error: "No updatable fields provided"});
    });

    it("should reject when recruiting is closed", async () => {
      await seedRecruitConfig(false); // Close recruiting

      const response = await request(app)
        .patch("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .send({name: "New Name"})
        .expect(403);

      expect(response.body).toHaveProperty("error");
    });

    it("should ignore non-updatable fields like kaistEmail", async () => {
      const response = await request(app)
        .patch("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Name",
          kaistEmail: "hacker@evil.com", // Should be ignored
          passwordHash: "hacked", // Should be ignored
        })
        .expect(200);

      expect(response.body).toEqual({success: true});

      // Verify kaistEmail didn't change
      const getResponse = await request(app)
        .get("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.kaistEmail).toBe(testEmail);
    });
  });

  describe("POST /v2/recruit/reset-password", () => {
    const testEmail = "reset@kaist.ac.kr";

    beforeEach(async () => {
      const passwordHash = await hashPassword("OldPassword123!");
      await seedRecruitApplication(testEmail, passwordHash);
    });

    it("should accept reset request for existing application", async () => {
      const response = await request(app)
        .post("/v2/recruit/reset-password")
        .send({kaistEmail: testEmail})
        .expect(200);

      expect(response.body).toEqual({success: true});
    });

    it("should accept reset request even for non-existent email (privacy)", async () => {
      // Should not reveal if email exists
      const response = await request(app)
        .post("/v2/recruit/reset-password")
        .send({kaistEmail: "nonexistent@kaist.ac.kr"})
        .expect(200);

      expect(response.body).toEqual({success: true});
    });

    it("should reject missing kaistEmail", async () => {
      const response = await request(app)
        .post("/v2/recruit/reset-password")
        .send({})
        .expect(400);

      expect(response.body).toEqual({error: "kaistEmail is required"});
    });
  });

  describe("GET /v2/recruit/config", () => {
    it("should return config when recruiting is open", async () => {
      await seedRecruitConfig(true);

      const response = await request(app)
        .get("/v2/recruit/config")
        .expect(200);

      expect(response.body).toHaveProperty("isOpen", true);
      expect(response.body).toHaveProperty("semester", "2024-Fall");
      expect(response.body).toHaveProperty("messageWhenClosed");
      expect(response.body).toHaveProperty("openAt");
      expect(response.body).toHaveProperty("closeAt");
    });

    it("should return config when recruiting is closed", async () => {
      await seedRecruitConfig(false);

      const response = await request(app)
        .get("/v2/recruit/config")
        .expect(200);

      expect(response.body).toHaveProperty("isOpen", false);
      expect(response.body).toHaveProperty("messageWhenClosed");
    });

    it("should not require authentication", async () => {
      await seedRecruitConfig(true);

      // No Authorization header
      const response = await request(app)
        .get("/v2/recruit/config")
        .expect(200);

      expect(response.body).toHaveProperty("isOpen");
    });

    it("should return ISO 8601 timestamps", async () => {
      await seedRecruitConfig(true);

      const response = await request(app)
        .get("/v2/recruit/config")
        .expect(200);

      expect(response.body.openAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.body.closeAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("Legacy Error Format Compatibility", () => {
    it("should return legacy error format {error: string}", async () => {
      await seedRecruitConfig(true);

      const response = await request(app)
        .post("/v2/recruit/applications")
        .send({}) // Missing all fields
        .expect(400);

      // Legacy format: {error: "message"}
      expect(response.body).toHaveProperty("error");
      expect(typeof response.body.error).toBe("string");
      // NOT v2 AppError format: {error: {code, message}}
      expect(response.body.error).not.toHaveProperty("code");
    });
  });

  describe("Rate Limiting", () => {
    it("should rate limit /applications endpoint (5 requests/min)", async () => {
      await seedRecruitConfig(true);

      const validApp = {
        name: "Test",
        kaistEmail: "ratelimit@kaist.ac.kr",
        googleEmail: "test@gmail.com",
        phone: "010-1234-5678",
        department: "CS",
        studentId: "20240001",
        motivation: "Test",
        experience: "Test",
        wantsToDo: "Test",
        password: "Pass123!",
      };

      // First 5 should succeed or hit business logic errors
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/v2/recruit/applications")
          .send({...validApp, kaistEmail: `test${i}@kaist.ac.kr`});
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post("/v2/recruit/applications")
        .send({...validApp, kaistEmail: "test6@kaist.ac.kr"});

      expect(response.status).toBe(429);
    }, 10000); // Increase timeout for rate limit test

    it("should rate limit /login endpoint (20 requests/min)", async () => {
      const passwordHash = await hashPassword("password");
      await seedRecruitApplication("login@kaist.ac.kr", passwordHash);

      // First 20 should succeed or hit auth errors
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post("/v2/recruit/login")
          .send({kaistEmail: "login@kaist.ac.kr", password: "wrong"});
      }

      // 21st request should be rate limited
      const response = await request(app)
        .post("/v2/recruit/login")
        .send({kaistEmail: "login@kaist.ac.kr", password: "wrong"});

      expect(response.status).toBe(429);
    }, 15000); // Increase timeout for rate limit test
  });

  describe("End-to-End Flow", () => {
    it("allows applicants to apply, login, read profile, update, and reset password", async () => {
      await seedRecruitConfig(true);

      const applicant = {
        name: "Recruit Tester",
        kaistEmail: "recruit_tester@kaist.ac.kr",
        googleEmail: "tester@example.com",
        phone: "010-1234-5678",
        department: "Computer Science",
        studentId: "20240000",
        motivation: "I love building communities.",
        experience: "Hackathons and projects",
        wantsToDo: "Backend platform",
        githubUsername: "recruit-tester",
        portfolioUrl: "https://example.com",
        password: "StrongPass123!",
      };

      // 1. Check config
      const configResponse = await request(app)
        .get("/v2/recruit/config")
        .expect(200);
      expect(configResponse.body.isOpen).toBe(true);

      // 2. Apply
      const applyResponse = await request(app)
        .post("/v2/recruit/applications")
        .send(applicant)
        .expect(200);
      expect(applyResponse.body.success).toBe(true);

      // 3. Login
      const loginResponse = await request(app)
        .post("/v2/recruit/login")
        .send({
          kaistEmail: applicant.kaistEmail,
          password: applicant.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const token = loginResponse.body.token as string;
      expect(typeof token).toBe("string");

      // 4. Get profile
      const profileResponse = await request(app)
        .get("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(profileResponse.body.kaistEmail).toBe(applicant.kaistEmail.toLowerCase());

      // 5. Update profile
      await request(app)
        .patch("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .send({githubUsername: "updated-gh"})
        .expect(200);

      // 6. Verify update
      const updatedProfile = await request(app)
        .get("/v2/recruit/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(updatedProfile.body.githubUsername).toBe("updated-gh");

      // 7. Reset password
      const resetResponse = await request(app)
        .post("/v2/recruit/reset-password")
        .send({kaistEmail: applicant.kaistEmail})
        .expect(200);
      expect(resetResponse.body.success).toBe(true);
    });
  });
});
