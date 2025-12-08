import express from "express";
import {v2Router} from "../../src/routes/v2";
import {corsMiddleware} from "../../src/middleware/cors";
import {errorHandler} from "../../src/middleware/errorHandler";
import {requestLogger} from "../../src/middleware/requestLogger";
import {telemetryMiddleware} from "../../src/middleware/telemetry";
import {healthRouter} from "../../src/routes/healthRoutes";

export function createTestApp(): express.Express {
  const app = express();
  // Enable trust proxy for test environment to correctly read X-Forwarded-For headers
  if (process.env.NODE_ENV === "test" || process.env.FUNCTIONS_EMULATOR === "true") {
    app.set("trust proxy", true);
  }
  // Capture telemetry before logging
  app.use(telemetryMiddleware);
  app.use(requestLogger);
  app.use(corsMiddleware);
  app.use(express.json());
  // Expose health for degrade-mode tests at root
  app.use("/healthz", healthRouter);
  app.use("/v2", v2Router);
  app.use(errorHandler);
  return app;
}
