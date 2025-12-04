import {Router} from "express";
import {serveOpenApiJson, serveSwaggerHtml} from "../../controllers/v2/docsController";

const docsRouter = Router();

docsRouter.get("/openapi.json", serveOpenApiJson);
docsRouter.get("/docs", serveSwaggerHtml);

export {docsRouter};
