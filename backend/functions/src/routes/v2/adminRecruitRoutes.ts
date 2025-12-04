import {Router} from "express";
import {
  getRecruitConfig,
  listRecruitApplications,
  updateRecruitApplicationStatus,
  updateRecruitConfig,
} from "../../controllers/v2/adminRecruitController";
import {authMiddleware} from "../../middleware/authMiddleware";
import {requireAdmin} from "../../middleware/requireRole";

const adminRecruitRouter = Router();

adminRecruitRouter.use(authMiddleware, requireAdmin);

adminRecruitRouter.get("/config", getRecruitConfig);
adminRecruitRouter.patch("/config", updateRecruitConfig);
adminRecruitRouter.get("/applications", listRecruitApplications);
adminRecruitRouter.patch("/applications/:applicationId/status", updateRecruitApplicationStatus);

export {adminRecruitRouter};
