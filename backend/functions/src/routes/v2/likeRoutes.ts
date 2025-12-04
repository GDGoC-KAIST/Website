import {Router} from "express";
import {toggleLike} from "../../controllers/v2/likeController";
import {authMiddleware} from "../../middleware/authMiddleware";

const likeRouter = Router();

likeRouter.post("/toggle", authMiddleware, toggleLike);

export {likeRouter};
