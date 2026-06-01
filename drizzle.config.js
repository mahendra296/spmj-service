import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./drizzle/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_DATABASE_URL,
  },
});
