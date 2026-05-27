import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import requestIp from "request-ip";

import { pageRouter } from "./routes/page.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { attachUser } from "./middlewares/verify-auth-middleware.js";
import logger from "./utils/logger.js";
import httpLogger from "./middlewares/http-logger.js";
import metricsMiddleware from "./middlewares/metrics-middleware.js";
import { register, named } from "./utils/metrics.js";
import { env } from "./validators/env.js";
import { SESSION_MAX_AGE } from "./config/constant.js";

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

// parse cookies
app.use(cookieParser());

// session management
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: SESSION_MAX_AGE },
  })
);
app.use(flash());

// Get Ip address for user request
app.use(requestIp.mw());

// Serve static files before auth check (CSS, JS, images don't need authentication)
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach signed-in admin to res.locals so views can read it as `user`
app.use(attachUser);

app.set("view engine", "ejs");

app.use(pageRouter);

const PORT = env.PORT || 3000;

const startServer = async () => {
  try {
    // 404 handler - must be after all other routes
    app.use(notFoundHandler);

    // Global error handler - must be last
    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
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
