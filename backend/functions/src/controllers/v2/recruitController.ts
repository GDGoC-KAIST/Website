import type {Request, Response, NextFunction} from "express";
import {
  recruitApplyHandler,
  recruitLoginHandler,
  recruitMeHandler,
  recruitUpdateHandler,
  recruitResetHandler,
  recruitConfigHandler,
} from "../../controllers/recruitController";

type LegacyHandler = (req: Request, res: Response) => Promise<void> | void;

function overrideMethod(req: Request, method?: string): () => void {
  if (!method || req.method === method) {
    return () => {};
  }
  const requestWithMethod = req as Request & {method: string};
  const originalMethod = requestWithMethod.method;
  requestWithMethod.method = method;
  return () => {
    requestWithMethod.method = originalMethod;
  };
}

async function callLegacyHandler(
  handler: LegacyHandler,
  req: Request,
  res: Response,
  next: NextFunction,
  methodOverride?: string
): Promise<void> {
  const restore = overrideMethod(req, methodOverride);
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  } finally {
    restore();
  }
}

export function apply(req: Request, res: Response, next: NextFunction): Promise<void> {
  return callLegacyHandler(recruitApplyHandler, req, res, next, "POST");
}

export function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  return callLegacyHandler(recruitLoginHandler, req, res, next, "POST");
}

export function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  return callLegacyHandler(recruitMeHandler, req, res, next, "GET");
}

export function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  return callLegacyHandler(recruitUpdateHandler, req, res, next, "POST");
}

export function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  return callLegacyHandler(recruitResetHandler, req, res, next, "POST");
}

export function config(req: Request, res: Response, next: NextFunction): Promise<void> {
  return callLegacyHandler(recruitConfigHandler, req, res, next, "GET");
}
