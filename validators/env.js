import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Session
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required").default("spmj-dev-secret-change-me"),

  // PostgreSQL database
  POSTGRES_DATABASE_URL: z
    .string()
    .min(1, "POSTGRES_DATABASE_URL is required")
    .default("postgresql://postgres:root@localhost:5432/spmjdb"),

  // Seed credentials (used by drizzle/seed.js)
  ADMIN_EMAIL: z.string().email().default("admin@spmjfoundation.org"),
  ADMIN_PASSWORD: z.string().min(1).default("Admin@123"),
  USER_EMAIL: z.string().email().default("user@spmjfoundation.org"),
  USER_PASSWORD: z.string().min(1).default("User@123"),
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
