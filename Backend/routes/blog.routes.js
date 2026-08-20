import { Router } from "express";
import * as blogController from "../controller/blogController.js";
import { uploadBlogCover, withUpload } from "../middlewares/upload-middleware.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";

const publicRouter = Router();
publicRouter.get("/api/blog", blogController.getBlogPosts);
publicRouter.get("/api/blog/:slug", blogController.getBlogDetail);
export const blogPublicRouter = publicRouter;

const adminRouter = Router();
adminRouter.get("/api/admin/blog", requireAdmin, blogController.listBlogAdmin);
adminRouter.get("/api/admin/blog/:id", requireAdmin, blogController.getBlogAdmin);
adminRouter.post(
  "/api/admin/blog",
  requireAdmin,
  withUpload(uploadBlogCover),
  blogController.createBlogAdmin
);
adminRouter.put(
  "/api/admin/blog/:id",
  requireAdmin,
  withUpload(uploadBlogCover),
  blogController.updateBlogAdmin
);
adminRouter.delete("/api/admin/blog/:id", requireAdmin, blogController.deleteBlogAdmin);
export const blogAdminRouter = adminRouter;
