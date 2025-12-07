import {Router} from "express";
import {
  deleteImage,
  getImage,
  listImages,
  updateImage,
  uploadImage,
} from "../../controllers/v2/imageController";
import {authMiddleware} from "../../middleware/authMiddleware";
import {optionalAuthMiddleware} from "../../middleware/optionalAuth";
import {requireMember} from "../../middleware/requireRole";
import {uploadErrorHandler} from "../../middleware/uploadErrorHandler";

const imageRouter = Router();

imageRouter.post("/", authMiddleware, requireMember, uploadImage);
imageRouter.get("/", optionalAuthMiddleware, listImages);
imageRouter.get("/:imageId", optionalAuthMiddleware, getImage);
imageRouter.patch("/:imageId", authMiddleware, updateImage);
imageRouter.delete("/:imageId", authMiddleware, deleteImage);

// Handle oversized uploads cleanly to avoid client-side ECONNRESET
imageRouter.use(uploadErrorHandler);

export {imageRouter};
