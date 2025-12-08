import type {Request, Response, NextFunction} from "express";
import {MigrationService} from "../../services/migrationService.ts";
import {AppError} from "../../utils/appError.ts";

const migrationService = new MigrationService();

function mapAdmin(req: Request) {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return {sub: req.user.sub, roles: req.user.roles};
}

export async function runMigration(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapAdmin(req);
    const name = (req.query.name as string) || req.body?.name;
    if (!name) {
      throw new AppError(400, "INVALID_ARGUMENT", "name query parameter is required");
    }
    const dryRunParam = req.query.dryRun ?? req.body?.dryRun;
    const limitParam = req.query.limit ?? req.body?.limit;
    const dryRun = typeof dryRunParam === "string"
      ? dryRunParam.toLowerCase() === "true"
      : Boolean(dryRunParam);
    const limit = limitParam !== undefined ? Number(limitParam) : undefined;

    const report = await migrationService.run(user, name, {dryRun, limit});
    res.status(200).json({ok: true, report});
  } catch (error) {
    next(error);
  }
}
