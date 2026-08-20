import { Router } from "express";
import * as authController from "../controller/authController.js";
import { listEventsMeta } from "../controller/eventController.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";

const router = Router();

router.post("/api/auth/login", authController.submitLogin);
router.post("/api/auth/logout", authController.logout);
router.post("/api/auth/refresh", authController.refresh);
router.get("/api/auth/me", authController.me);

export const authRouter = router;

// Admin-only — no path prefix mount needed, the global "/api/admin"
// requireAdmin gate in index.js already covers every path here.
const adminRouter = Router();
adminRouter.get("/api/admin/dashboard", requireAdmin, authController.getDashboard);
adminRouter.get("/api/admin/meta/events", requireAdmin, listEventsMeta);
export const adminDashboardRouter = adminRouter;
