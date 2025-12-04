import {Router} from "express";
import {loginGithub, refresh, logout} from "../../controllers/v2/authController";
import {authMiddleware} from "../../middleware/authMiddleware";

const authRouter = Router();

authRouter.post("/login/github", loginGithub);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", authMiddleware, logout);

export {authRouter};
