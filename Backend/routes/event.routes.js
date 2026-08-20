import { Router } from "express";
import * as eventController from "../controller/eventController.js";
import { uploadEventCover, withUpload } from "../middlewares/upload-middleware.js";

const publicRouter = Router();
publicRouter.get("/", eventController.getEvents);
publicRouter.get("/:slug", eventController.getEventDetail);
export const eventPublicRouter = publicRouter;

const adminRouter = Router();
adminRouter.get("/", eventController.listEventsAdmin);
adminRouter.get("/:id", eventController.getEventAdmin);
adminRouter.post("/", withUpload(uploadEventCover), eventController.createEventAdmin);
adminRouter.put("/:id", withUpload(uploadEventCover), eventController.updateEventAdmin);
adminRouter.delete("/:id", eventController.deleteEventAdmin);
export const eventAdminRouter = adminRouter;
