import type {Request, Response, NextFunction} from "express";
import {LikeService} from "../../services/likeService.ts";
import {AppError} from "../../utils/appError.ts";

const likeService = new LikeService();

export async function toggleLike(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const result = await likeService.toggleLike(
      {sub: req.user.sub, roles: req.user.roles},
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
