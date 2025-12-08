import {Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {getMe, patchMe, linkMember} from "../../controllers/v2/userController.ts";
import {validateRequest} from "../../middleware/validateRequest.ts";
import {linkMemberSchema} from "../../validators/schemas/userSchemas.ts";

const userRouter = Router();

userRouter.get("/me", authMiddleware, getMe);
userRouter.patch("/me", authMiddleware, patchMe);
userRouter.post(
  "/link-member",
  authMiddleware,
  validateRequest({body: linkMemberSchema}),
  linkMember
);

export {userRouter};
