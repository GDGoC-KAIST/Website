import {Request, Response, NextFunction} from "express";
import {MemberAdminService} from "../../services/memberService.ts";
import {AppError} from "../../utils/appError.ts";
import type {MemberRole} from "../../types/member.ts";

const adminService = new MemberAdminService();

export async function createMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {name, studentId, department, generation, role, blogName, blogDescription} = req.body ?? {};

    if (!name || !studentId || !department || typeof generation !== "number" || !role) {
      throw new AppError(400, "INVALID_ARGUMENT", "Missing required member fields");
    }

    const result = await adminService.createMember({
      name,
      studentId,
      department,
      generation,
      role: role as MemberRole,
      blogName,
      blogDescription,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetLinkCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {memberId} = req.params;
    if (!memberId) {
      res.status(400).json({error: "memberId is required"});
      return;
    }

    const {expiresInDays} = req.body ?? {};
    if (expiresInDays === undefined || typeof expiresInDays !== "number" || expiresInDays <= 0) {
      res.status(400).json({error: "expiresInDays must be a positive number"});
      return;
    }

    const result = await adminService.resetLinkCode(memberId, expiresInDays);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
