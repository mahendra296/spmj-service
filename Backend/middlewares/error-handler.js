import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

/**
 * Global error handler middleware. Every response from this API is JSON.
 * Must be registered after all routes.
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

  return res.status(statusCode).json(ApiResponse.error(message));
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

  return res.status(404).json(ApiResponse.error("Resource not found"));
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { errorHandler, notFoundHandler, asyncHandler };
