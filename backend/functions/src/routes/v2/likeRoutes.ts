import {Router} from "express";
import {toggleLike} from "../../controllers/v2/likeController.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {validateRequest} from "../../middleware/validateRequest.ts";
import {toggleLikeSchema} from "../../validators/schemas/likeSchemas.ts";

const likeRouter = Router();

likeRouter.post(
  "/toggle",
  authMiddleware,
  validateRequest({body: toggleLikeSchema}),
  toggleLike
);

export {likeRouter};
