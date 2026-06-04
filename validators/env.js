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

  // PostgreSQL database
  POSTGRES_DATABASE_URL: z
    .string()
    .min(1, "POSTGRES_DATABASE_URL is required")
    .default("postgresql://postgres:root@localhost:5432/spmjdb"),

  // Razorpay — optional so the app still boots without them; the donation
  // flow detects whether they're set and degrades gracefully when they aren't.
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
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
