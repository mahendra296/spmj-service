import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Session (used for flash messages only)
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required").default("spmj-dev-secret-change-me"),

  // JWT access / refresh token secrets
  JWT_SECRET: z
    .string()
    .min(1, "JWT_SECRET is required")
    .default("spmj-jwt-access-secret-change-me"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(1, "REFRESH_TOKEN_SECRET is required")
    .default("spmj-jwt-refresh-secret-change-me"),

  // MySQL database
  MYSQL_DATABASE_URL: z
    .string()
    .min(1, "MYSQL_DATABASE_URL is required")
    .default("mysql://root:root@localhost:3306/spmjdb"),

  // Razorpay — optional so the app still boots without them; the donation
  // flow detects whether they're set and degrades gracefully when they aren't.
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),

  // Gmail / transactional email — optional so the app still boots without
  // credentials; sends are skipped with a warning when either is empty
  // (see config/mailer.js). GMAIL_APP_PASSWORD must be a Google **App
  // Password**, not the account password.
  GMAIL_USER: z.string().default(""),
  GMAIL_APP_PASSWORD: z.string().default(""),
  // Optional From override — must be a verified "Send mail as" alias of
  // GMAIL_USER, otherwise Gmail rewrites or rejects it. Defaults to GMAIL_USER.
  MAIL_FROM: z.string().default(""),
  MAIL_FROM_NAME: z.string().default(""),
  MAIL_REPLY_TO: z.string().default(""),

  // Public base URL used to build absolute links in emails (receipt lookup).
  APP_BASE_URL: z.string().default("http://localhost:3000"),

  // Base directory for uploaded files. The events/blog/gallery subfolders
  // are always appended to this (see middlewares/upload-middleware.js) —
  // only the base changes, e.g. to point at a mounted volume in production.
  UPLOAD_DIR: z.string().min(1, "UPLOAD_DIR is required").default("public/uploads"),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment validation failed:");
    console.error(result.error.format());
    throw new Error("Invalid environment variables");
  }

  return result.data;
};

export const env = parseEnv();
