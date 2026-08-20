import client from "prom-client";
import logger from "./logger.js";

// Enable default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics();

// Counter for tracking all HTTP requests
const httpRequestCounter = new client.Counter({
  name: "local_http_request_total",
  help: "Total number of HTTP requests",
  labelNames: ["methodname", "status", "endpoint_url", "result", "operation"],
});

// Tag a route with an operation name (used for metrics) and log when the
// endpoint is entered and when it finishes — so every request to a named
// endpoint leaves a clear trail for diagnosing issues.
export const named = (operationName) => (req, res, next) => {
  req.operationName = operationName;

  logger.info(`Endpoint → ${operationName}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.clientIp || req.ip,
  });

  // Log the outcome once the response is sent (fires regardless of how the
  // handler ended — success, redirect, or error).
  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger.log(level, `Endpoint ← ${operationName}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
    });
  });

  next();
};

export { httpRequestCounter };
export const register = client.register;
