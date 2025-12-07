import {Router} from "express";
import {authRouter} from "./authRoutes";
import {userRouter} from "./userRoutes";
import {adminMemberRouter} from "./adminMemberRoutes";
import {postRouter} from "./postRoutes";
import {imageRouter} from "./imageRoutes";
import {commentRouter} from "./commentRoutes";
import {likeRouter} from "./likeRoutes";
import {galleryRouter} from "./galleryRoutes";
import {adminRecruitRouter} from "./adminRecruitRoutes";
import {adminMigrationRouter} from "./adminMigrationRoutes";
import {docsRouter} from "./docsRoutes";
import {rateLimit} from "../../middleware/rateLimiter";
import {publicCache} from "../../middleware/cacheControl";
import {recruitRouter} from "./recruitRoutes";

const v2Router = Router();

// Docs routes
v2Router.use("/", docsRouter);

const loginRateLimiter = rateLimit({
  max: 10,
  windowMs: 60_000,
  keyGenerator: (req) => req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown",
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
