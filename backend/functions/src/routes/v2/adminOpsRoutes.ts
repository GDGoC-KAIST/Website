import {Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {requireAdmin} from "../../middleware/requireRole.ts";
import {getDailyTraffic, getHourlyTraffic} from "../../controllers/v2/adminOpsController.ts";

const adminOpsRouter = Router();

adminOpsRouter.use(authMiddleware, requireAdmin);
adminOpsRouter.get("/traffic/hourly", getHourlyTraffic);
adminOpsRouter.get("/traffic/daily", getDailyTraffic);

export {adminOpsRouter};
