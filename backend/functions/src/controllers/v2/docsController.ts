import type {Request, Response, NextFunction} from "express";
import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";
import {openApiOptions} from "../../docs/openapi";

const swaggerHtmlPath = path.join(process.cwd(), "public/swagger-ui.html");

/**
 * Serve OpenAPI JSON specification
 * GET /v2/openapi.json
 */
export function serveOpenApiJson(_req: Request, res: Response, next: NextFunction) {
  try {
    const spec = swaggerJsdoc(openApiOptions);

    // Runtime injection to ensure TipTapDoc exists (defensive fix for swagger-jsdoc)
    const s = spec as any;
    s.components = s.components || {};
    s.components.schemas = s.components.schemas || {};
    s.components.schemas.TipTapDoc = s.components.schemas.TipTapDoc || {
      type: "object",
      additionalProperties: true,
      description: "TipTap editor JSON structure - injected at runtime",
    };

    res.status(200).json(spec);
  } catch (error) {
    next(error);
  }
}

/**
 * Serve Swagger UI HTML page
 * GET /v2/docs
 */
export function serveSwaggerUi(_req: Request, res: Response, next: NextFunction) {
  try {
    if (fs.existsSync(swaggerHtmlPath)) {
      const html = fs.readFileSync(swaggerHtmlPath, "utf8");
      res.setHeader("Content-Type", "text/html");
      res.status(200).send(html);
    } else {
      // Fallback: Inline HTML if file doesn't exist
      const inlineHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GDGoC KAIST API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "./openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
      `;
      res.setHeader("Content-Type", "text/html");
      res.status(200).send(inlineHtml);
    }
  } catch (error) {
    next(error);
  }
}
