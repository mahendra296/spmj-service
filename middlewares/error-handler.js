import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
const errorHandler = (err, req, res, next) => {
  logger.logError(err, req);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ZodError") {
    statusCode = 422;
    const errors = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    message = errors.join(", ");
  } else if (err.code === "ECONNREFUSED") {
    statusCode = 503;
    message = "Service unavailable";
  }

  // Make the resolved decision visible in the logs (separate from the raw
  // stack already logged above) so we can see what the client actually got.
  logger.warn("Request failed", {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    errorName: err.name,
    errorCode: err.code,
    message,
  });

  const isApiRequest =
    req.xhr ||
    req.headers.accept?.includes("application/json") ||
    req.path.startsWith("/api/");

  if (isApiRequest) {
    return res.status(statusCode).json(ApiResponse.error(message));
  }

  if (statusCode === 401) {
    if (typeof req.flash === "function") req.flash("error", message);
    return res.redirect("/admin/login");
  }

  if (statusCode === 404) {
    return res.status(404).render("404", { title: "Page not found", page: "404" });
  }

  if (typeof req.flash === "function") req.flash("error", message);
  // Express 5 removed the magic `res.redirect("back")` — it would now redirect
  // to a literal "/back" path. Send the user back to the referring page using
  // the Referer header, guarding against a loop if that page is the one that
  // errored, and falling back to the home page.
  return res.redirect(safeBackUrl(req));
};

/** Express-5-safe "go back": the Referer (unless it's the current path) or "/". */
const safeBackUrl = (req) => {
  const referer = req.get("referer");
  if (!referer) return "/";
  try {
    const refPath = new URL(referer, `${req.protocol}://${req.get("host")}`).pathname;
    if (refPath !== req.path) return referer;
  } catch {
    // Malformed Referer — ignore and use the fallback.
  }
  return "/";
};

/**
 * 404 Not Found handler
 * Should be registered after all routes but before error handler
 */
const notFoundHandler = (req, res, next) => {
  // The 404 path was previously silent — log it with full context so an
  // unexpected 404 (e.g. a route that should exist) is easy to spot and trace.
  logger.warn("404 Not Found — no route matched", {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    referer: req.get("referer") || null,
    userAgent: req.get("user-agent") || null,
    ip: req.clientIp || req.ip,
    authenticated: Boolean(req.user),
  });

  const isApiRequest =
    req.xhr ||
    req.headers.accept?.includes("application/json") ||
    req.path.startsWith("/api/");

  if (isApiRequest) {
    return res.status(404).json(ApiResponse.error("Resource not found"));
  }

  res.status(404).render("404", { title: "Page not found", page: "404" });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { errorHandler, notFoundHandler, asyncHandler };
