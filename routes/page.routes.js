import { Router } from "express";
import * as pageController from "../controller/pageController.js";
import * as contactController from "../controller/contactController.js";
import * as authController from "../controller/authController.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";
import { named } from "../utils/metrics.js";

const router = Router();

// Public pages
router.get("/", named("pub_get_home"), pageController.getHomePage);
router.get("/about", named("pub_get_about"), pageController.getAboutPage);
router.get("/services", named("pub_get_services"), pageController.getServicesPage);

// Contact form
router
  .route("/contact")
  .get(named("pub_get_contact"), contactController.getContactPage)
  .post(named("pub_post_contact"), contactController.submitContact);

// Admin authentication
router
  .route("/admin/login")
  .get(named("pub_get_admin_login"), authController.getLoginPage)
  .post(named("pub_post_admin_login"), authController.submitLogin);

router.get(
  "/admin/dashboard",
  named("pri_get_admin_dashboard"),
  requireAdmin,
  authController.getDashboardPage
);

router.post(
  "/admin/logout",
  named("pri_post_admin_logout"),
  authController.logout
);

export const pageRouter = router;
