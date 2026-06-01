import morgan from "morgan";
import logger from "../utils/logger.js";

morgan.token("client-ip", (req) => req.clientIp || req.ip);
morgan.token("user-id", (req) => req.session?.user?.email || "anonymous");
morgan.token("response-time-ms", (req, res) => {
  if (!req._startAt || !res._startAt) {
    return "-";
  }
  const ms =
    (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

// Production format
const customFormat =
  ":client-ip :user-id :method :url :status :response-time-ms ms - :res[content-length]";

// Development format
const devFormat = ":method :url :status :response-time ms - :res[content-length]";

const httpLogger = morgan(
  process.env.NODE_ENV === "production" ? customFormat : devFormat,
  {
    stream: logger.stream,
    // Skip logging for static assets in production
    skip: (req, res) => {
      if (process.env.NODE_ENV === "production") {
        const staticExtensions = [".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".woff2"];
        return staticExtensions.some((ext) => req.url.endsWith(ext));
      }
      return false;
    },
  }
);

export { httpLogger };
export default httpLogger;
