import {Router} from "express";
import {
  deleteImage,
  getImage,
  listImages,
  updateImage,
  uploadImage,
} from "../../controllers/v2/imageController.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {optionalAuthMiddleware} from "../../middleware/optionalAuth.ts";
import {requireMember} from "../../middleware/requireRole.ts";
import {uploadErrorHandler} from "../../middleware/uploadErrorHandler.ts";

const imageRouter = Router();

imageRouter.post("/", authMiddleware, requireMember, uploadImage);
imageRouter.get("/", optionalAuthMiddleware, listImages);
imageRouter.get("/:imageId", optionalAuthMiddleware, getImage);
imageRouter.patch("/:imageId", authMiddleware, updateImage);
imageRouter.delete("/:imageId", authMiddleware, deleteImage);

// Handle oversized uploads cleanly to avoid client-side ECONNRESET
imageRouter.use(uploadErrorHandler);

export {imageRouter};
