import {Router} from "express";
import {createComment, deleteComment, listComments} from "../../controllers/v2/commentController";
import {authMiddleware} from "../../middleware/authMiddleware";
import {optionalAuthMiddleware} from "../../middleware/optionalAuth";

const commentRouter = Router();

commentRouter.post("/", authMiddleware, createComment);
commentRouter.get("/", optionalAuthMiddleware, listComments);
commentRouter.delete("/:commentId", authMiddleware, deleteComment);

export {commentRouter};
