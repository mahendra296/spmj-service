import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "info";
};

// Console format
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// File format (no color)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const logDir = path.join(__dirname, "..", "logs");

const transports = [
  new winston.transports.Console({ format: consoleFormat }),
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    format: fileFormat,
    maxsize: 5242880,
    maxFiles: 5,
    zippedArchive: true,
  }),
  new winston.transports.File({
    filename: path.join(logDir, "combined.log"),
    format: fileFormat,
    maxsize: 5242880,
    maxFiles: 5,
    zippedArchive: true,
  }),
  new winston.transports.File({
    filename: path.join(logDir, "http.log"),
    level: "http",
    format: fileFormat,
    maxsize: 5242880,
    maxFiles: 5,
    zippedArchive: true,
  }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
      zippedArchive: true,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "rejections.log"),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
      zippedArchive: true,
    }),
  ],
});

/* ---------- SLF4J-style "{}" placeholder support ----------
 * Lets services write: logger.info("Donor email: {}", email)
 *                      logger.error("Error while executing createOrder", err)
 * Each "{}" is replaced by the next argument; any leftover args become
 * structured metadata (Error objects are serialised to message/stack/name).
 * Calls without "{}" keep their existing behaviour, so nothing else breaks.
 */
const renderArg = (a) => {
  if (a instanceof Error) return a.message;
  if (a !== null && typeof a === "object") {
    try {
      return JSON.stringify(a);
    } catch {
      return String(a);
    }
  }
  return String(a);
};

const wrapLevel = (fn) => (message, ...args) => {
  if (typeof message !== "string" || args.length === 0) return fn(message, ...args);

  let i = 0;
  const text = message.replace(/\{\}/g, () => (i < args.length ? renderArg(args[i++]) : "{}"));

  // Anything not consumed by a "{}" becomes metadata.
  const leftover = args.slice(i);
  const meta = {};
  let hasMeta = false;
  for (const a of leftover) {
    if (a instanceof Error) {
      meta.error = a.message;
      meta.stack = a.stack;
      meta.name = a.name;
      hasMeta = true;
    } else if (a !== null && typeof a === "object") {
      Object.assign(meta, a);
      hasMeta = true;
    } else {
      (meta.args ||= []).push(a);
      hasMeta = true;
    }
  }
  return hasMeta ? fn(text, meta) : fn(text);
};

for (const lvl of ["error", "warn", "info", "http", "debug"]) {
  const original = logger[lvl].bind(logger);
  logger[lvl] = wrapLevel(original);
}

// Stream for morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging
logger.logRequest = (req, message = "Incoming request") => {
  logger.http(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.clientIp || req.ip,
    userAgent: req.get("user-agent"),
  });
};

logger.logResponse = (req, res, responseTime) => {
  logger.http("Response sent", {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
  });
};

logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };

  if (req) {
    errorInfo.method = req.method;
    errorInfo.url = req.originalUrl;
    errorInfo.ip = req.clientIp || req.ip;
  }

  logger.error("Error occurred", errorInfo);
};

logger.logAuth = (action, userId = null, details = {}) => {
  logger.info(`Auth: ${action}`, { userId, ...details });
};

export default logger;
