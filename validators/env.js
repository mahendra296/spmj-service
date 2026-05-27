import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Session
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required").default("spmg-dev-secret-change-me"),

  // Admin credentials
  ADMIN_USER: z.string().min(1).default("admin"),
  ADMIN_PASS: z.string().min(1).default("admin123"),
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
