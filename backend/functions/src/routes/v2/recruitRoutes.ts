import {Router} from "express";
import {apply, login, me, updateMe, resetPassword, config} from "../../controllers/v2/recruitController";
import {rateLimit} from "../../middleware/rateLimiter";
import {validateRequest} from "../../middleware/validateRequest";
import {recruitAuthMiddleware} from "../../middleware/recruitAuthMiddleware";
import {
  recruitApplySchema,
  recruitLoginSchema,
  recruitUpdateSchema,
  recruitResetSchema,
} from "../../validators/schemas/recruitSchemas";

const recruitRouter = Router();

const applyLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  keyGenerator: (req) => req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown",
});

const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  keyGenerator: (req) => req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown",
});

// Public endpoints
recruitRouter.post(
  "/applications",
  applyLimiter,
  validateRequest({body: recruitApplySchema}),
  apply
);
recruitRouter.post("/login", loginLimiter, validateRequest({body: recruitLoginSchema}), login);
recruitRouter.get("/config", config);
recruitRouter.post(
  "/reset-password",
  validateRequest({body: recruitResetSchema}),
  resetPassword
);

// Protected endpoints (require Bearer token from recruitSessions)
recruitRouter.get("/me", recruitAuthMiddleware, me);
recruitRouter.patch("/me", recruitAuthMiddleware, validateRequest({body: recruitUpdateSchema}), updateMe);

export {recruitRouter};
