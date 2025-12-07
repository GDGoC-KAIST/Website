import {Router} from "express";
import {healthz} from "../../controllers/v2/healthController";

const healthRouter = Router();
healthRouter.get("/", healthz);

export {healthRouter};
