import { Router } from "express";
import * as authController from "../controller/authController.js";
import { listEventsMeta } from "../controller/eventController.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";

const router = Router();

router.post("/login", authController.submitLogin);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", authController.me);

export const authRouter = router;

// Mounted separately at /api/admin — kept here since it's auth-adjacent
// (dashboard is the one "admin" endpoint with no dedicated resource router).
const adminRouter = Router();
adminRouter.get("/dashboard", requireAdmin, authController.getDashboard);
adminRouter.get("/meta/events", requireAdmin, listEventsMeta);
export const adminDashboardRouter = adminRouter;
