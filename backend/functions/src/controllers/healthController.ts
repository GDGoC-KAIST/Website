import type {Request, Response} from "express";
import {env} from "../config/env";

export function healthz(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    version: "2.0.0",
    commit: env.commitHash,
    timestamp: new Date().toISOString(),
    killSwitches: {
      email: env.disableEmailSending,
      githubLogin: env.disableGithubLogin,
    },
  });
}
