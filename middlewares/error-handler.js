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
  return res.redirect("back");
};

/**
 * 404 Not Found handler
 * Should be registered after all routes but before error handler
 */
const notFoundHandler = (req, res, next) => {
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
