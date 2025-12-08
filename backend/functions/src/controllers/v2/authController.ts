import {Request, Response, NextFunction} from "express";
import {AuthV2Service} from "../../services/authService.ts";
import {AppError} from "../../utils/appError.ts";
import {SessionRepo} from "../../repositories/sessionRepo.ts";
import {env} from "../../config/env.ts";
import {check as checkAbuseGuard} from "../../services/abuseGuard/abuseGuardService.ts";

const authService = new AuthV2Service();
const sessionRepo = new SessionRepo();

export async function loginGithub(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const abuseResult = await checkAbuseGuard("auth_login", req.telemetry, 20, 60, 120);
    if (!abuseResult.allowed) {
      throw AppError.tooManyRequests("Too many login attempts", {
        requestId: (req as Request & {id?: string}).id,
        rateLimited: true,
        blockedUntil: abuseResult.blockedUntil,
        remaining: abuseResult.remaining,
      });
    }

    if (env.disableGithubLogin) {
      throw new AppError(503, "SERVICE_DISABLED", "GitHub login is temporarily disabled");
    }
    const {githubAccessToken} = req.body as {githubAccessToken: string};

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
    const {refreshToken} = req.body as {refreshToken: string};

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
    console.log("[DEBUG] Logout start. Body:", req.body, "Query:", req.query);
    const {user} = req;
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
    console.log("[DEBUG] Logout success. Sending response.");
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
