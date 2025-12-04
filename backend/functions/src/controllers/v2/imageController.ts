import type {Request, Response, NextFunction} from "express";
import {ImageService, ListImageQuery, UpdateImageDto, UserContext} from "../../services/imageService";
import {AppError} from "../../utils/appError";

const imageService = new ImageService();

function optionalUser(req: Request): UserContext | undefined {
  if (!req.user) return undefined;
  return {sub: req.user.sub, roles: req.user.roles};
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const user = {sub: req.user.sub, roles: req.user.roles};
    const image = await imageService.uploadImage(user, req);
    res.status(201).json({image});
  } catch (error) {
    next(error);
  }
}

export async function listImages(req: Request, res: Response, next: NextFunction) {
  try {
    const user = optionalUser(req);
    const query: ListImageQuery = {
      uploaderUserId: req.query.uploaderUserId as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
    };
    const result = await imageService.listImages(user, query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getImage(req: Request, res: Response, next: NextFunction) {
  try {
    const user = optionalUser(req);
    const image = await imageService.getImage(user, req.params.imageId);
    res.status(200).json({image});
  } catch (error) {
    next(error);
  }
}

export async function updateImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const user = {sub: req.user.sub, roles: req.user.roles};
    const body = req.body as UpdateImageDto;
    const image = await imageService.updateImage(user, req.params.imageId, body);
    res.status(200).json({image});
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const user = {sub: req.user.sub, roles: req.user.roles};
    await imageService.deleteImage(user, req.params.imageId);
    res.status(200).json({ok: true});
  } catch (error) {
    next(error);
  }
}
