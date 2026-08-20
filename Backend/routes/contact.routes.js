import { Router } from "express";
import * as contactController from "../controller/contactController.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";

const router = Router();
router.post("/api/contact", contactController.submitContact);
export const contactRouter = router;

const adminRouter = Router();
adminRouter.get("/api/admin/contact", requireAdmin, contactController.listContactAdmin);
adminRouter.delete("/api/admin/contact/:id", requireAdmin, contactController.deleteContactAdmin);
export const contactAdminRouter = adminRouter;
