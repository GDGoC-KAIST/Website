import {Router} from "express";
import {loginGithub, refresh, logout} from "../../controllers/v2/authController";
import {authMiddleware} from "../../middleware/authMiddleware";
import {validateRequest} from "../../middleware/validateRequest";
import {loginSchema, refreshSchema} from "../../validators/schemas/authSchemas";

const authRouter = Router();

authRouter.post("/login/github", validateRequest({body: loginSchema}), loginGithub);
authRouter.post("/refresh", validateRequest({body: refreshSchema}), refresh);
authRouter.post("/logout", authMiddleware, logout);

export {authRouter};
