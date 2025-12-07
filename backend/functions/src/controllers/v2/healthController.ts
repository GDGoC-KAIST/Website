import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export async function healthz(_req: Request, res: Response): Promise<void> {
  try {
    await getFirestore().collection("health_check").limit(1).get();
    res.status(200).json({
      ok: true,
      service: "functions",
      ts: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Health check failed", {error});
    res.status(503).json({error: "Service Unavailable"});
  }
}
