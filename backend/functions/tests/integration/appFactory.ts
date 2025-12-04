import express from "express";
import {v2Router} from "../../src/routes/v2";
import {corsMiddleware} from "../../src/middleware/cors";
import {errorHandler} from "../../src/middleware/errorHandler";

export function createTestApp(): express.Express {
  const app = express();
  app.use(corsMiddleware);
  app.use(express.json());
  app.use("/v2", v2Router);
  app.use(errorHandler);
  return app;
}
