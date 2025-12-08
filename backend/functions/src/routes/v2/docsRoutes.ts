import {Router} from "express";
import swaggerUi from "swagger-ui-express";
import {
	serveOpenApiJson,
	serveOpenApiOpsJson,
	serveOpenApiPublicJson,
	serveOpenApiAdminJson,
	serveSwaggerUi,
} from "../../controllers/v2/docsController.ts";

const docsRouter = Router();

// Serve raw JSON specs
docsRouter.get("/openapi.json", serveOpenApiJson);
docsRouter.get("/openapi.public.json", serveOpenApiPublicJson);
docsRouter.get("/openapi.admin.json", serveOpenApiAdminJson);
docsRouter.get("/openapi.ops.json", serveOpenApiOpsJson);

// Swagger UI with multiple specs (inline, no redirect)
docsRouter.get("/docs", serveSwaggerUi);

// Serve static assets for Swagger UI if prebuilt HTML is present
docsRouter.use("/docs", swaggerUi.serve);

// Fallback inline UI if static file missing (handles pre-baked HTML case)
docsRouter.get("/docs-inline", serveSwaggerUi);

export {docsRouter};
