import { Router } from "express";
import * as blogController from "../controller/blogController.js";
import { uploadBlogCover, withUpload } from "../middlewares/upload-middleware.js";

const publicRouter = Router();
publicRouter.get("/", blogController.getBlogPosts);
publicRouter.get("/:slug", blogController.getBlogDetail);
export const blogPublicRouter = publicRouter;

const adminRouter = Router();
adminRouter.get("/", blogController.listBlogAdmin);
adminRouter.get("/:id", blogController.getBlogAdmin);
adminRouter.post("/", withUpload(uploadBlogCover), blogController.createBlogAdmin);
adminRouter.put("/:id", withUpload(uploadBlogCover), blogController.updateBlogAdmin);
adminRouter.delete("/:id", blogController.deleteBlogAdmin);
export const blogAdminRouter = adminRouter;
