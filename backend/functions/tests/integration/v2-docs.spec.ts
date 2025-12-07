import request from "supertest";
import {createTestApp} from "./appFactory";
import {setupTestEnv, teardownTestEnv, clearFirestore} from "./setup";

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

describe("V2 API Documentation Endpoints", () => {
  describe("GET /v2/openapi.json", () => {
    it("returns OpenAPI 3.0.0 JSON specification", async () => {
      const response = await request(app)
        .get("/v2/openapi.json")
        .expect(200)
        .expect("Content-Type", /json/);

      // Verify OpenAPI version
      expect(response.body.openapi).toBe("3.0.0");

      // Verify API info
      expect(response.body.info).toBeDefined();
      expect(response.body.info.title).toContain("GDGoC KAIST API");
      expect(response.body.info.version).toBe("2.0.0");

      // Verify servers are defined
      expect(response.body.servers).toBeDefined();
      expect(Array.isArray(response.body.servers)).toBe(true);
      expect(response.body.servers.length).toBeGreaterThan(0);

      // Verify security schemes
      expect(response.body.components).toBeDefined();
      expect(response.body.components.securitySchemes).toBeDefined();
      expect(response.body.components.securitySchemes.bearerAuth).toBeDefined();

      // CRITICAL: Verify TipTapDoc schema is present (prevents contract test failures)
      expect(response.body.components.schemas).toBeDefined();
      expect(response.body.components.schemas.TipTapDoc).toBeDefined();
      expect(response.body.components.schemas.TipTapDoc.type).toBe("object");
      expect(response.body.components.schemas.TipTapDoc.additionalProperties).toBe(true);
    });

    it("includes all required schemas", async () => {
      const response = await request(app)
        .get("/v2/openapi.json")
        .expect(200);

      const schemas = response.body.components?.schemas || {};

      // Verify core schemas exist
      expect(schemas.User).toBeDefined();
      expect(schemas.Post).toBeDefined();
      expect(schemas.Comment).toBeDefined();
      expect(schemas.TipTapDoc).toBeDefined();
      expect(schemas.Error).toBeDefined();
      expect(schemas.Pagination).toBeDefined();
    });
  });

  describe("GET /v2/docs", () => {
    it("serves Swagger UI HTML page", async () => {
      const response = await request(app)
        .get("/v2/docs")
        .expect(200)
        .expect("Content-Type", /html/);

      // Verify HTML contains Swagger UI container
      expect(response.text).toContain('<div id="swagger-ui">');

      // Verify Swagger UI scripts are loaded
      expect(response.text).toContain("swagger-ui-bundle.js");
      expect(response.text).toContain("SwaggerUIBundle");

      // Verify it points to the OpenAPI spec
      expect(response.text).toContain("openapi.json");
    });

    it("uses BaseLayout to hide top bar", async () => {
      const response = await request(app)
        .get("/v2/docs")
        .expect(200);

      // Verify layout configuration
      expect(response.text).toContain("BaseLayout");
    });
  });

  describe("Smoke Test - Prevent Regression", () => {
    it("both endpoints are accessible", async () => {
      // Test JSON endpoint
      const jsonResponse = await request(app)
        .get("/v2/openapi.json")
        .expect(200);
      expect(jsonResponse.body.openapi).toBe("3.0.0");

      // Test HTML endpoint
      const htmlResponse = await request(app)
        .get("/v2/docs")
        .expect(200);
      expect(htmlResponse.text).toContain('<div id="swagger-ui">');
    });
  });
});
