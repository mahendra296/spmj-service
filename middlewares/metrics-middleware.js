import { httpRequestCounter } from "../utils/metrics.js";

const metricsMiddleware = (req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      methodname: req.method,
      status: res.statusCode,
      endpoint_url: req.originalUrl || req.url,
      result: res.statusCode < 400 ? "success" : "failure",
      operation: req.operationName || "unknown",
    });
  });
  next();
};

export default metricsMiddleware;
