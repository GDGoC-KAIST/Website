import {Router} from "express";
import {createComment, deleteComment, listComments} from "../../controllers/v2/commentController";
import {authMiddleware} from "../../middleware/authMiddleware";
import {optionalAuthMiddleware} from "../../middleware/optionalAuth";
import {validateRequest} from "../../middleware/validateRequest";
import {
  createCommentSchema,
  getCommentsSchema,
  deleteCommentSchema,
} from "../../validators/schemas/commentSchemas";

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
