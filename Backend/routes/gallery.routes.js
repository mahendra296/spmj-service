import { Router } from "express";
import * as galleryController from "../controller/galleryController.js";
import { uploadGalleryMedia, withUpload } from "../middlewares/upload-middleware.js";

const publicRouter = Router();
publicRouter.get("/", galleryController.getGallery);
export const galleryPublicRouter = publicRouter;

const adminRouter = Router();
adminRouter.get("/", galleryController.listGalleryAdmin);
adminRouter.get("/:id", galleryController.getGalleryAdmin);
adminRouter.post("/", withUpload(uploadGalleryMedia), galleryController.createGalleryAdmin);
adminRouter.put("/:id", withUpload(uploadGalleryMedia), galleryController.updateGalleryAdmin);
adminRouter.delete("/:id", galleryController.deleteGalleryAdmin);
export const galleryAdminRouter = adminRouter;
