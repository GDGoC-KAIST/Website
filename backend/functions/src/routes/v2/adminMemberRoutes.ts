import {Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {requireRole} from "../../middleware/requireRole.ts";
import {createMember, resetLinkCode} from "../../controllers/v2/adminMemberController.ts";
import {legacyErrorBridge} from "../../middleware/legacyErrorBridge.ts";

const adminMemberRouter = Router();

adminMemberRouter.use(authMiddleware, requireRole(["ADMIN"]));
adminMemberRouter.post("/", createMember);
adminMemberRouter.post("/:memberId/reset-link-code", resetLinkCode);

adminMemberRouter.use(legacyErrorBridge);

export {adminMemberRouter};
