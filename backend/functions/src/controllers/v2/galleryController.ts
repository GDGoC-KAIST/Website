import type {Request, Response, NextFunction} from "express";
import {GalleryService, CreateGalleryDto, UpdateGalleryDto} from "../../services/galleryService";
import {AppError} from "../../utils/appError";

const galleryService = new GalleryService();

function mapUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return {sub: req.user.sub, roles: req.user.roles};
}

export async function createGallery(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapUser(req);
    const gallery = await galleryService.createGallery(user, req.body as CreateGalleryDto);
    res.status(201).json({gallery});
  } catch (error) {
    next(error);
  }
}

export async function listGalleries(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await galleryService.listGalleries(
      req.query.limit ? Number(req.query.limit) : undefined,
      req.query.cursor as string | undefined
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getGallery(req: Request, res: Response, next: NextFunction) {
  try {
    const gallery = await galleryService.getGallery(req.params.galleryId);
    res.status(200).json({gallery});
  } catch (error) {
    next(error);
  }
}

export async function updateGallery(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapUser(req);
    await galleryService.updateGallery(user, req.params.galleryId, req.body as UpdateGalleryDto);
    res.status(200).json({ok: true});
  } catch (error) {
    next(error);
  }
}

export async function deleteGallery(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapUser(req);
    await galleryService.deleteGallery(user, req.params.galleryId);
    res.status(200).json({ok: true});
  } catch (error) {
    next(error);
  }
}
