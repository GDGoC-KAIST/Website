import {Router} from "express";
import {createComment, deleteComment, listComments} from "../../controllers/v2/commentController.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {optionalAuthMiddleware} from "../../middleware/optionalAuth.ts";
import {validateRequest} from "../../middleware/validateRequest.ts";
import {
  createCommentSchema,
  getCommentsSchema,
  deleteCommentSchema,
} from "../../validators/schemas/commentSchemas.ts";

const commentRouter = Router();

commentRouter.post(
  "/",
  authMiddleware,
  validateRequest({body: createCommentSchema}),
  createComment
);
commentRouter.get(
  "/",
  optionalAuthMiddleware,
  validateRequest({query: getCommentsSchema}),
  listComments
);
commentRouter.delete(
  "/:commentId",
  authMiddleware,
  validateRequest({params: deleteCommentSchema}),
  deleteComment
);

export {commentRouter};
