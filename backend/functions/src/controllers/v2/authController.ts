import {Request, Response, NextFunction} from "express";
import {AuthV2Service} from "../../services/authService";
import {AppError} from "../../utils/appError";
import {SessionRepo} from "../../repositories/sessionRepo";
import {env} from "../../config/env";

const authService = new AuthV2Service();
const sessionRepo = new SessionRepo();

export async function loginGithub(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (env.disableGithubLogin) {
      throw new AppError(503, "SERVICE_DISABLED", "GitHub login is temporarily disabled");
    }
    const {githubAccessToken} = req.body as {githubAccessToken?: string};

    if (!githubAccessToken) {
      throw new AppError(400, "INVALID_REQUEST", "githubAccessToken is required");
    }

    const result = await authService.loginWithGitHub(githubAccessToken, {
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });

    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {refreshToken} = req.body as {refreshToken?: string};
    if (!refreshToken) {
      throw new AppError(400, "INVALID_ARGUMENT", "refreshToken is required");
    }

    const result = await authService.refreshSession(refreshToken, {
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const body = (req.body ?? {}) as {all?: boolean; sessionId?: string};
    const queryAll = parseBooleanFlag(req.query.all);
    const shouldRevokeAll = queryAll ?? Boolean(body.all);

    if (shouldRevokeAll) {
      await sessionRepo.revokeAllSessions(user.sub);
      res.status(200).json({ok: true});
      return;
    }

    const requestedSessionId =
      (typeof req.query.sessionId === "string" && req.query.sessionId) || body.sessionId;

    if (requestedSessionId) {
      const target = await sessionRepo.findById(requestedSessionId);
      if (!target) {
        throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
      }
      if (target.userId !== user.sub) {
        throw new AppError(403, "FORBIDDEN", "Cannot revoke another user's session");
      }
      await sessionRepo.revokeSession(requestedSessionId);
      res.status(200).json({ok: true});
      return;
    }

    const currentSid = user.sid;
    if (!currentSid) {
      throw new AppError(400, "INVALID_ARGUMENT", "Current session unavailable");
    }

    await sessionRepo.revokeSession(currentSid);
    res.status(200).json({ok: true});
  } catch (error) {
    next(error);
  }
}

function parseBooleanFlag(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
  }
  return undefined;
}
