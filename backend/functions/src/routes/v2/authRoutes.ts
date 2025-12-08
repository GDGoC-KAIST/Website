import {Router} from "express";
import {loginGithub, refresh, logout} from "../../controllers/v2/authController.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {validateRequest} from "../../middleware/validateRequest.ts";
import {loginSchema, refreshSchema} from "../../validators/schemas/authSchemas.ts";

const authRouter = Router();

authRouter.post("/login/github", validateRequest({body: loginSchema}), loginGithub);
authRouter.post("/refresh", validateRequest({body: refreshSchema}), refresh);
authRouter.post("/logout", authMiddleware, logout);

export {authRouter};
