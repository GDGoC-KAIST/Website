import {Router} from "express";
import {runMigration} from "../../controllers/v2/adminMigrationController.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {requireAdmin} from "../../middleware/requireRole.ts";

const adminMigrationRouter = Router();

adminMigrationRouter.use(authMiddleware, requireAdmin);
adminMigrationRouter.post("/run", runMigration);

export {adminMigrationRouter};
