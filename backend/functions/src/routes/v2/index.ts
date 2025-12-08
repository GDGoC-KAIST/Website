import {Router} from "express";
import {authRouter} from "./authRoutes.ts";
import {userRouter} from "./userRoutes.ts";
import {adminMemberRouter} from "./adminMemberRoutes.ts";
import {postRouter} from "./postRoutes.ts";
import {imageRouter} from "./imageRoutes.ts";
import {commentRouter} from "./commentRoutes.ts";
import {likeRouter} from "./likeRoutes.ts";
import {galleryRouter} from "./galleryRoutes.ts";
import {adminRecruitRouter} from "./adminRecruitRoutes.ts";
import {adminMigrationRouter} from "./adminMigrationRoutes.ts";
import {docsRouter} from "./docsRoutes.ts";
import {rateLimit} from "../../middleware/rateLimiter.ts";
import {publicCache} from "../../middleware/cacheControl.ts";
import {recruitRouter} from "./recruitRoutes.ts";
import {healthRouter} from "./healthRoutes.ts";
import {adminOpsRouter} from "./adminOpsRoutes.ts";

const v2Router = Router();

// Docs routes
v2Router.use("/", docsRouter);
// Health route
v2Router.use("/healthz", healthRouter);
// Admin ops metrics
v2Router.use("/admin/ops", adminOpsRouter);

const loginRateLimiter = rateLimit({
  max: 10,
  windowMs: 60_000,
  keyGenerator: (req) =>
    req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown",
});

v2Router.use("/auth/login/github", loginRateLimiter);
// Auth routes
v2Router.use("/auth", authRouter);

// User routes
v2Router.use("/users", userRouter);

// Admin routes
v2Router.use("/admin/members", adminMemberRouter);

const postsCache = publicCache(60);
v2Router.use("/posts", (req, res, next) => {
  if (req.method === "GET") {
    return postsCache(req, res, next);
  }
  return next();
});
// Post routes
v2Router.use("/posts", postRouter);

// Image routes
v2Router.use("/images", imageRouter);

// Comment routes
v2Router.use("/comments", commentRouter);

// Like routes
v2Router.use("/likes", likeRouter);

// Gallery routes
v2Router.use("/galleries", galleryRouter);

// Public recruit routes
v2Router.use("/recruit", recruitRouter);

// Admin recruit routes
v2Router.use("/admin/recruit", adminRecruitRouter);

// Admin migrations
v2Router.use("/admin/migrations", adminMigrationRouter);

export {v2Router};
