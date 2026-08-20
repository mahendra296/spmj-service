import { Router } from "express";
import * as galleryController from "../controller/galleryController.js";
import { uploadGalleryMedia, withUpload } from "../middlewares/upload-middleware.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";

const publicRouter = Router();
publicRouter.get("/api/gallery", galleryController.getGallery);
export const galleryPublicRouter = publicRouter;

const adminRouter = Router();
adminRouter.get("/api/admin/gallery", requireAdmin, galleryController.listGalleryAdmin);
adminRouter.get("/api/admin/gallery/:id", requireAdmin, galleryController.getGalleryAdmin);
adminRouter.post(
  "/api/admin/gallery",
  requireAdmin,
  withUpload(uploadGalleryMedia),
  galleryController.createGalleryAdmin
);
adminRouter.put(
  "/api/admin/gallery/:id",
  requireAdmin,
  withUpload(uploadGalleryMedia),
  galleryController.updateGalleryAdmin
);
adminRouter.delete("/api/admin/gallery/:id", requireAdmin, galleryController.deleteGalleryAdmin);
export const galleryAdminRouter = adminRouter;
