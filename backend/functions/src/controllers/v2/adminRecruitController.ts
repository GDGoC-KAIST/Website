import type {Request, Response, NextFunction} from "express";
import {RecruitService, UpdateApplicationStatusDto, UpdateConfigDto} from "../../services/recruitService";
import {AppError} from "../../utils/appError";

const recruitService = new RecruitService();

function mapAdmin(req: Request) {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return {sub: req.user.sub, roles: req.user.roles};
}

export async function getRecruitConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapAdmin(req);
    const config = await recruitService.getConfig(user);
    res.status(200).json({config});
  } catch (error) {
    next(error);
  }
}

export async function updateRecruitConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapAdmin(req);
    await recruitService.updateConfig(user, req.body as UpdateConfigDto);
    res.status(200).json({ok: true});
  } catch (error) {
    next(error);
  }
}

export async function listRecruitApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapAdmin(req);
    const result = await recruitService.listApplications(
      user,
      {
        status: req.query.status as any,
      },
      req.query.limit ? Number(req.query.limit) : undefined,
      req.query.cursor as string | undefined
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateRecruitApplicationStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = mapAdmin(req);
    const body = req.body as UpdateApplicationStatusDto;
    const result = await recruitService.updateApplicationStatus(user, req.params.applicationId, body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
