import {Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware";
import {getMe, patchMe, linkMember} from "../../controllers/v2/userController";

const userRouter = Router();

userRouter.get("/me", authMiddleware, getMe);
userRouter.patch("/me", authMiddleware, patchMe);
userRouter.post("/link-member", authMiddleware, linkMember);

export {userRouter};
