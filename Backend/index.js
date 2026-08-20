import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import requestIp from "request-ip";

import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { verifyAuthToken } from "./middlewares/verify-auth-middleware.js";
import { loadSessionsIntoCache } from "./service/auth-service.js";
import logger from "./utils/logger.js";
import httpLogger from "./middlewares/http-logger.js";
import metricsMiddleware from "./middlewares/metrics-middleware.js";
import { register, named } from "./utils/metrics.js";
import { env } from "./validators/env.js";

import { authRouter, adminDashboardRouter } from "./routes/auth.routes.js";
import { eventPublicRouter, eventAdminRouter } from "./routes/event.routes.js";
import { blogPublicRouter, blogAdminRouter } from "./routes/blog.routes.js";
import { galleryPublicRouter, galleryAdminRouter } from "./routes/gallery.routes.js";
import { donationPublicRouter, donationAdminRouter } from "./routes/donation.routes.js";
import { contactRouter, contactAdminRouter } from "./routes/contact.routes.js";

const app = express();

// HTTP request logging (should be first middleware)
app.use(httpLogger);

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Expose /metrics endpoint for Prometheus scraping (before auth)
app.get("/metrics", named("sys_get_metrics"), async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// CORS — credentialed, restricted to the configured Frontend origin so the
// SPA's cookies (httpOnly access/refresh tokens) actually get sent/kept.
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));

// parse cookies
app.use(cookieParser());

// Get Ip address for user request
app.use(requestIp.mw());

// Serve static files (uploaded event/blog/gallery media) before auth check.
app.use(express.static("public"));

// Capture the raw JSON body so the Razorpay webhook can verify its HMAC
// signature against the exact bytes received (parsing would otherwise lose it).
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Verify the JWT access/refresh tokens and attach the signed-in user to
// req.user. Never rejects — public endpoints work for everyone; route
// guards (requireAdmin) enforce protected endpoints.
app.use(verifyAuthToken);

// Every router below declares its own full path (e.g. "/api/events/:slug")
// and its own auth guard (requireAdmin) where needed — index.js just mounts
// them flat, with no path prefixes or middleware of its own.
app.use(authRouter);
app.use(adminDashboardRouter);
app.use(eventPublicRouter);
app.use(eventAdminRouter);
app.use(blogPublicRouter);
app.use(blogAdminRouter);
app.use(galleryPublicRouter);
app.use(galleryAdminRouter);
app.use(donationPublicRouter);
app.use(donationAdminRouter);
app.use(contactRouter);
app.use(contactAdminRouter);

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    // Warm the session cache so existing logins survive a restart.
    try {
      const count = await loadSessionsIntoCache();
      logger.info(`Loaded ${count} active session(s) into cache`);
    } catch (error) {
      logger.error("Could not load sessions into cache:", {
        error: error.message,
      });
    }

    // 404 handler - must be after all other routes
    app.use(notFoundHandler);

    // Global error handler - must be last
    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`Backend API is running on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
