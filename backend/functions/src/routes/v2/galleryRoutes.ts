import {Router} from "express";
import {
  createGallery,
  deleteGallery,
  getGallery,
  listGalleries,
  updateGallery,
} from "../../controllers/v2/galleryController";
import {authMiddleware} from "../../middleware/authMiddleware";
import {requireAdmin} from "../../middleware/requireRole";

const galleryRouter = Router();

galleryRouter.get("/", listGalleries);
galleryRouter.get("/:galleryId", getGallery);
galleryRouter.post("/", authMiddleware, requireAdmin, createGallery);
galleryRouter.patch("/:galleryId", authMiddleware, requireAdmin, updateGallery);
galleryRouter.delete("/:galleryId", authMiddleware, requireAdmin, deleteGallery);

export {galleryRouter};
