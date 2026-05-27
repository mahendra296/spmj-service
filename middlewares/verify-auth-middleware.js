/**
 * Attach signed-in admin session to res.locals so views can reference `user`.
 * Mirrors the reference service pattern where res.locals.user is set globally.
 */
export const attachUser = (req, res, next) => {
  res.locals.user = req.session?.admin || null;
  next();
};

/**
 * Guard middleware for admin-only routes.
 * Redirects unauthenticated visitors to the admin login page.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.session?.admin) {
    if (typeof req.flash === "function") {
      req.flash("error", "Please sign in to continue");
    }
    return res.redirect("/admin/login");
  }
  return next();
};
