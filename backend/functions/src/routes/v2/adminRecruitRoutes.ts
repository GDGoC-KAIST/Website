import {Router} from "express";
import {
  getRecruitConfig,
  listRecruitApplications,
  updateRecruitApplicationStatus,
  updateRecruitConfig,
} from "../../controllers/v2/adminRecruitController.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {requireAdmin} from "../../middleware/requireRole.ts";

const adminRecruitRouter = Router();

adminRecruitRouter.use(authMiddleware, requireAdmin);

adminRecruitRouter.get("/config", getRecruitConfig);
adminRecruitRouter.patch("/config", updateRecruitConfig);
adminRecruitRouter.get("/applications", listRecruitApplications);
adminRecruitRouter.patch("/applications/:applicationId/status", updateRecruitApplicationStatus);

export {adminRecruitRouter};
