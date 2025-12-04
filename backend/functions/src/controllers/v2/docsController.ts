import type {Request, Response, NextFunction} from "express";
import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";
import {openApiOptions} from "../../docs/openapi";

const swaggerHtmlPath = path.join(process.cwd(), "public/swagger-ui.html");

export function serveOpenApiJson(_req: Request, res: Response, next: NextFunction) {
  try {
    const spec = swaggerJsdoc(openApiOptions);
    const s = spec as any;

    s.components = s.components || {};
    s.components.schemas = s.components.schemas || {};
    s.components.schemas.TipTapDoc = s.components.schemas.TipTapDoc || {
      type: "object",
      additionalProperties: true,
      description: "Injected runtime schema for TipTapDoc",
    };

    res.status(200).json(spec);
  } catch (error) {
    next(error);
  }
}

export function serveSwaggerHtml(_req: Request, res: Response, next: NextFunction) {
  try {
    const html = fs.readFileSync(swaggerHtmlPath, "utf8");
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
}
