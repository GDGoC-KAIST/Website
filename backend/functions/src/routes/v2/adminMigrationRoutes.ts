import {Router} from "express";
import {runMigration} from "../../controllers/v2/adminMigrationController";
import {authMiddleware} from "../../middleware/authMiddleware";
import {requireAdmin} from "../../middleware/requireRole";

const adminMigrationRouter = Router();

adminMigrationRouter.use(authMiddleware, requireAdmin);
adminMigrationRouter.post("/run", runMigration);

export {adminMigrationRouter};
