import type {Request, Response, NextFunction} from "express";
import {UserService, type UserProfile} from "../../services/userService";
import {AppError} from "../../utils/appError";
import {MemberLinkService} from "../../services/memberService";
import {Timestamp} from "firebase-admin/firestore";

const userService = new UserService();
const memberLinkService = new MemberLinkService();

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const profile = await userService.getMe(user.sub);
    res.status(200).json({user: serializeUser(profile)});
  } catch (error) {
    next(error);
  }
}

export async function patchMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const body = req.body ?? {};
    const allowedFields = ["name", "phone", "department", "studentId", "profileImage"];
    const forbiddenFields = ["role", "roles", "uid", "id", "email", "createdAt", "updatedAt"];

    const keys = Object.keys(body);
    if (keys.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "No fields to update");
    }

    for (const field of keys) {
      if (forbiddenFields.includes(field)) {
        throw new AppError(403, "FORBIDDEN", "Cannot update restricted fields");
      }
      if (!allowedFields.includes(field)) {
        throw new AppError(400, "INVALID_INPUT", `Invalid field: ${field}`);
      }
    }

    const updatePayload: Record<string, unknown> = {};

    const stringFields: Array<{key: string; target: string}> = [
      {key: "name", target: "name"},
      {key: "phone", target: "phone"},
      {key: "department", target: "department"},
      {key: "studentId", target: "studentId"},
    ];

    for (const {key, target} of stringFields) {
      if (key in body) {
        if (typeof body[key] !== "string") {
          throw new AppError(400, "INVALID_INPUT", `Invalid field: ${key}`);
        }
        updatePayload[target] = (body[key] as string).trim();
      }
    }

    if ("profileImage" in body) {
      const value = body.profileImage;
      if (value === null || value === "") {
        updatePayload.profileImageUrl = null;
      } else if (typeof value === "string") {
        updatePayload.profileImageUrl = value;
      } else {
        throw new AppError(400, "INVALID_INPUT", "Invalid field: profileImage");
      }
    }

    const profile = await userService.updateProfile(user.sub, updatePayload);
    res.status(200).json({user: serializeUser(profile)});
  } catch (error) {
    next(error);
  }
}

export async function linkMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const {linkCode} = req.body as {linkCode: string};
    await memberLinkService.linkMember(user.sub, linkCode);
    const profile = await userService.getMe(user.sub);
    res.status(200).json({ok: true, user: serializeUser(profile)});
  } catch (error) {
    next(error);
  }
}

type SerializableUser = Omit<UserProfile, "createdAt" | "updatedAt" | "lastLoginAt"> & {
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
  displayProfileImageUrl?: string;
};

function serializeUser(user: UserProfile): SerializableUser {
  const {createdAt, updatedAt, lastLoginAt, ...rest} = user;
  return {
    ...rest,
    createdAt: toIsoOrNull(createdAt),
    updatedAt: toIsoOrNull(updatedAt),
    lastLoginAt: toIsoOrNull(lastLoginAt),
  };
}

function toIsoOrNull(value?: Timestamp | Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return value.toDate().toISOString();
}
