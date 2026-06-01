import { ROLES } from "../config/constant.js";

/**
 * Attach the signed-in user (from the session) to res.locals so views
 * can reference it as `user`.
 */
export const attachUser = (req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
};

/**
 * Require an authenticated user (any role).
 * Redirects unauthenticated visitors to the admin login page.
 */
export const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    if (typeof req.flash === "function") {
      req.flash("error", "Please sign in to continue");
    }
    return res.redirect("/admin/login");
  }
  return next();
};

/**
 * Require the authenticated user to have one of the given roles.
 * - Not signed in  -> redirect to login
 * - Wrong role     -> redirect home with a permission message
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    const user = req.session?.user;

    if (!user) {
      if (typeof req.flash === "function") {
        req.flash("error", "Please sign in to continue");
      }
      return res.redirect("/admin/login");
    }

    if (!roles.includes(user.role)) {
      if (typeof req.flash === "function") {
        req.flash("error", "You don't have permission to access that page.");
      }
      return res.redirect("/");
    }

    return next();
  };
};

/**
 * Guard middleware for admin-only routes (ROLE_ADMIN).
 */
export const requireAdmin = requireRole(ROLES.ADMIN);
