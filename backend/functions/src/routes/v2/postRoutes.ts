import {Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware";
import {optionalAuthMiddleware} from "../../middleware/optionalAuth";
import {requireMember} from "../../middleware/requireRole";
import {createPost, getPost, listPosts, updatePost, deletePost} from "../../controllers/v2/postController";
import {validateRequest} from "../../middleware/validateRequest";
import {
  createPostSchema,
  updatePostSchema,
  postIdParamsSchema,
} from "../../validators/schemas/postSchemas";

const postRouter = Router();

postRouter.post(
  "/",
  authMiddleware,
  requireMember,
  validateRequest({body: createPostSchema}),
  createPost
);
postRouter.get("/", optionalAuthMiddleware, listPosts);
postRouter.get(
  "/:postId",
  optionalAuthMiddleware,
  validateRequest({params: postIdParamsSchema}),
  getPost
);
postRouter.patch(
  "/:postId",
  authMiddleware,
  requireMember,
  validateRequest({params: postIdParamsSchema, body: updatePostSchema}),
  updatePost
);
postRouter.delete(
  "/:postId",
  authMiddleware,
  requireMember,
  validateRequest({params: postIdParamsSchema}),
  deletePost
);

export {postRouter};
