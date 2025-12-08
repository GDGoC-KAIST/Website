import type {Request, Response, NextFunction} from "express";
import fs from "fs";
import path from "path";

const swaggerHtmlPath = path.join(process.cwd(), "public/swagger-ui.html");
const docsDir = path.join(process.cwd(), "docs");

function serveFile(filePath: string, res: Response) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    res.status(404).json({error: "Spec file not found"});
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.sendFile(resolved);
}

export function serveOpenApiJson(_req: Request, res: Response, next: NextFunction) {
  try {
    const opsPath = path.join(docsDir, "openapi.ops.json");
    serveFile(opsPath, res);
  } catch (error) {
    next(error);
  }
}

export function serveOpenApiOpsJson(_req: Request, res: Response, next: NextFunction) {
  try {
    const opsPath = path.join(docsDir, "openapi.ops.json");
    serveFile(opsPath, res);
  } catch (error) {
    next(error);
  }
}

export function serveOpenApiPublicJson(_req: Request, res: Response, next: NextFunction) {
  try {
    const publicPath = path.join(docsDir, "openapi.public.json");
    serveFile(publicPath, res);
  } catch (error) {
    next(error);
  }
}

export function serveOpenApiAdminJson(_req: Request, res: Response, next: NextFunction) {
  try {
    const adminPath = path.join(docsDir, "openapi.admin.json");
    serveFile(adminPath, res);
  } catch (error) {
    next(error);
  }
}

export function serveSwaggerUi(_req: Request, res: Response, next: NextFunction) {
  try {
    if (fs.existsSync(swaggerHtmlPath)) {
      const html = fs.readFileSync(swaggerHtmlPath, "utf8");
      res.setHeader("Content-Type", "text/html");
      res.status(200).send(html);
      return;
    }

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
        urls: [
          { url: '/v2/openapi.public.json', name: 'Public' },
          { url: '/v2/openapi.admin.json', name: 'Admin' },
          { url: '/v2/openapi.ops.json', name: 'Ops' }
        ],
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
  } catch (error) {
    next(error);
  }
}
