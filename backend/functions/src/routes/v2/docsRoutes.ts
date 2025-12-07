import {Router} from "express";
import {serveOpenApiJson, serveSwaggerUi} from "../../controllers/v2/docsController";

const docsRouter = Router();

/**
 * Documentation routes
 * GET /v2/openapi.json - OpenAPI JSON specification
 * GET /v2/docs - Swagger UI HTML page
 */
docsRouter.get("/openapi.json", serveOpenApiJson);
docsRouter.get("/docs", serveSwaggerUi);

export {docsRouter};
