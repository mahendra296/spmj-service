import { Router } from "express";
import * as pageController from "../controller/pageController.js";
import * as contactController from "../controller/contactController.js";
import * as authController from "../controller/authController.js";
import * as eventController from "../controller/eventController.js";
import * as blogController from "../controller/blogController.js";
import * as galleryController from "../controller/galleryController.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";
import {
  uploadEventCover,
  uploadBlogCover,
  uploadGalleryMedia,
  withUpload,
} from "../middlewares/upload-middleware.js";
import { named } from "../utils/metrics.js";

const router = Router();

/* ---------- Public pages ---------- */
router.get("/", named("pub_get_home"), pageController.getHomePage);
router.get("/about", named("pub_get_about"), pageController.getAboutPage);
router.get("/services", named("pub_get_services"), pageController.getServicesPage);

router.get("/events", named("pub_get_events"), eventController.getEventsPage);
router.get("/events/:slug", named("pub_get_event"), eventController.getEventDetailPage);

// Gallery now lives within the Programs page.
router.get("/gallery", named("pub_get_gallery"), (req, res) =>
  res.redirect(301, "/services#gallery")
);

router.get("/blog", named("pub_get_blog"), blogController.getBlogPage);
router.get("/blog/:slug", named("pub_get_blog_post"), blogController.getBlogDetailPage);

// Contact form
router
  .route("/contact")
  .get(named("pub_get_contact"), contactController.getContactPage)
  .post(named("pub_post_contact"), contactController.submitContact);

/* ---------- Admin authentication ---------- */
router
  .route("/admin/login")
  .get(named("pub_get_admin_login"), authController.getLoginPage)
  .post(named("pub_post_admin_login"), authController.submitLogin);

router.post("/admin/logout", named("pri_post_admin_logout"), authController.logout);

router.get(
  "/admin/dashboard",
  named("pri_get_admin_dashboard"),
  requireAdmin,
  authController.getDashboardPage
);

/* ---------- Admin: Events (ROLE_ADMIN) ---------- */
const eventEdit = (req) =>
  req.params.id ? `/admin/events/${req.params.id}/edit` : "/admin/events/new";

router.get("/admin/events", named("pri_get_events"), requireAdmin, eventController.listEventsAdmin);
router.get("/admin/events/new", named("pri_get_event_new"), requireAdmin, eventController.newEventForm);
router.post(
  "/admin/events",
  named("pri_post_event_create"),
  requireAdmin,
  withUpload(uploadEventCover, eventEdit),
  eventController.createEventAdmin
);
router.get("/admin/events/:id/edit", named("pri_get_event_edit"), requireAdmin, eventController.editEventForm);
router.post(
  "/admin/events/:id",
  named("pri_post_event_update"),
  requireAdmin,
  withUpload(uploadEventCover, eventEdit),
  eventController.updateEventAdmin
);
router.post("/admin/events/:id/delete", named("pri_post_event_delete"), requireAdmin, eventController.deleteEventAdmin);

/* ---------- Admin: Blog / News (ROLE_ADMIN) ---------- */
const blogEdit = (req) =>
  req.params.id ? `/admin/blog/${req.params.id}/edit` : "/admin/blog/new";

router.get("/admin/blog", named("pri_get_blog"), requireAdmin, blogController.listBlogAdmin);
router.get("/admin/blog/new", named("pri_get_blog_new"), requireAdmin, blogController.newBlogForm);
router.post(
  "/admin/blog",
  named("pri_post_blog_create"),
  requireAdmin,
  withUpload(uploadBlogCover, blogEdit),
  blogController.createBlogAdmin
);
router.get("/admin/blog/:id/edit", named("pri_get_blog_edit"), requireAdmin, blogController.editBlogForm);
router.post(
  "/admin/blog/:id",
  named("pri_post_blog_update"),
  requireAdmin,
  withUpload(uploadBlogCover, blogEdit),
  blogController.updateBlogAdmin
);
router.post("/admin/blog/:id/delete", named("pri_post_blog_delete"), requireAdmin, blogController.deleteBlogAdmin);

/* ---------- Admin: Gallery (ROLE_ADMIN) ---------- */
const galleryEdit = (req) =>
  req.params.id ? `/admin/gallery/${req.params.id}/edit` : "/admin/gallery/new";

router.get("/admin/gallery", named("pri_get_gallery"), requireAdmin, galleryController.listGalleryAdmin);
router.get("/admin/gallery/new", named("pri_get_gallery_new"), requireAdmin, galleryController.newGalleryForm);
router.post(
  "/admin/gallery",
  named("pri_post_gallery_create"),
  requireAdmin,
  withUpload(uploadGalleryMedia, galleryEdit),
  galleryController.createGalleryAdmin
);
router.get("/admin/gallery/:id/edit", named("pri_get_gallery_edit"), requireAdmin, galleryController.editGalleryForm);
router.post(
  "/admin/gallery/:id",
  named("pri_post_gallery_update"),
  requireAdmin,
  withUpload(uploadGalleryMedia, galleryEdit),
  galleryController.updateGalleryAdmin
);
router.post("/admin/gallery/:id/delete", named("pri_post_gallery_delete"), requireAdmin, galleryController.deleteGalleryAdmin);

export const pageRouter = router;
