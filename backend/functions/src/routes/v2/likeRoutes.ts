import {Router} from "express";
import {toggleLike} from "../../controllers/v2/likeController";
import {authMiddleware} from "../../middleware/authMiddleware";
import {validateRequest} from "../../middleware/validateRequest";
import {toggleLikeSchema} from "../../validators/schemas/likeSchemas";

const likeRouter = Router();

likeRouter.post(
  "/toggle",
  authMiddleware,
  validateRequest({body: toggleLikeSchema}),
  toggleLike
);

export {likeRouter};
