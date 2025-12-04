import {Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware";
import {optionalAuthMiddleware} from "../../middleware/optionalAuth";
import {requireMember} from "../../middleware/requireRole";
import {createPost, getPost, listPosts, updatePost, deletePost} from "../../controllers/v2/postController";

const postRouter = Router();

postRouter.post("/", authMiddleware, requireMember, createPost);
postRouter.get("/", optionalAuthMiddleware, listPosts);
postRouter.get("/:postId", optionalAuthMiddleware, getPost);
postRouter.patch("/:postId", authMiddleware, requireMember, updatePost);
postRouter.delete("/:postId", authMiddleware, requireMember, deletePost);

export {postRouter};
