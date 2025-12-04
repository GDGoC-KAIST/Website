import type {Request, Response, NextFunction} from "express";
import {AppError} from "../utils/appError";
import type {Role} from "../types/auth";

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(
          401,
          "UNAUTHORIZED",
          "Authentication required"
        );
      }

      const userRoles = req.user.roles || [];

      const hasRequiredRole = allowedRoles.some((role) =>
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        throw new AppError(
          403,
          "FORBIDDEN",
          `Requires one of the following roles: ${allowedRoles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Helper constants
export const requireAuth = requireRole(["USER", "MEMBER", "ADMIN"]);
export const requireMember = requireRole(["MEMBER", "ADMIN"]);
export const requireAdmin = requireRole(["ADMIN"]);
