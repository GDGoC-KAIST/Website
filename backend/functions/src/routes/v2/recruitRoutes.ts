import {Router} from "express";
import {apply, login, me, updateMe, resetPassword, config} from "../../controllers/v2/recruitController";
import {rateLimit, MemoryRateLimitStore} from "../../middleware/rateLimiter";
import {recruitAuthMiddleware} from "../../middleware/recruitAuthMiddleware";
import {recruitLegacyErrorBridge} from "../../middleware/recruitLegacyErrorBridge";

const recruitRouter = Router();

// Create dedicated stores for recruit endpoints (exported for testing)
export const recruitApplyStore = new MemoryRateLimitStore();
export const recruitLoginStore = new MemoryRateLimitStore();

const applyLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  keyGenerator: (req) => req.ip || "unknown",
  store: recruitApplyStore,
});

const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  keyGenerator: (req) => req.ip || "unknown",
  store: recruitLoginStore,
});

// Public endpoints
recruitRouter.post("/applications", applyLimiter, apply);
recruitRouter.post("/login", loginLimiter, login);
recruitRouter.post("/reset-password", resetPassword);
recruitRouter.get("/config", config);

// Protected endpoints (require Bearer token from recruitSessions)
recruitRouter.use(recruitAuthMiddleware);
recruitRouter.get("/me", me);
recruitRouter.patch("/me", updateMe);

recruitRouter.use(recruitLegacyErrorBridge);

export {recruitRouter};
