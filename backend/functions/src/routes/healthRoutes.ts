import {Router} from "express";
import {healthz} from "../controllers/healthController";

const healthRouter = Router();

healthRouter.get("/", healthz);

export {healthRouter};
