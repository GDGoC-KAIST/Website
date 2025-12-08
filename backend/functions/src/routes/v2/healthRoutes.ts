import {Router} from "express";
import {healthz} from "../../controllers/v2/healthController.ts";

const healthRouter = Router();
healthRouter.get("/", healthz);

export {healthRouter};
