import { Router } from "express";
import * as eventController from "../controller/eventController.js";
import { uploadEventCover, withUpload } from "../middlewares/upload-middleware.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";

const publicRouter = Router();
publicRouter.get("/api/events", eventController.getEvents);
publicRouter.get("/api/events/:slug", eventController.getEventDetail);
export const eventPublicRouter = publicRouter;

const adminRouter = Router();
adminRouter.get("/api/admin/events", requireAdmin, eventController.listEventsAdmin);
adminRouter.get("/api/admin/events/:id", requireAdmin, eventController.getEventAdmin);
adminRouter.post(
  "/api/admin/events",
  requireAdmin,
  withUpload(uploadEventCover),
  eventController.createEventAdmin
);
adminRouter.put(
  "/api/admin/events/:id",
  requireAdmin,
  withUpload(uploadEventCover),
  eventController.updateEventAdmin
);
adminRouter.delete("/api/admin/events/:id", requireAdmin, eventController.deleteEventAdmin);
export const eventAdminRouter = adminRouter;
