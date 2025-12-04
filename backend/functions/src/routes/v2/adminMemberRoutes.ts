import {Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware";
import {requireRole} from "../../middleware/requireRole";
import {createMember, resetLinkCode} from "../../controllers/v2/adminMemberController";

const adminMemberRouter = Router();

adminMemberRouter.use(authMiddleware, requireRole(["ADMIN"]));
adminMemberRouter.post("/", createMember);
adminMemberRouter.post("/:memberId/reset-link-code", resetLinkCode);

export {adminMemberRouter};
