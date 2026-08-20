// PostgreSQL database connection (Drizzle ORM + postgres-js)

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema.js";

const connectionString = process.env.POSTGRES_DATABASE_URL;

const client = postgres(connectionString, {
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Timeout for connection attempts
});

export const db = drizzle(client, { schema });

// Close the connection pool (used by one-off scripts like the seeder)
export const closeDb = async () => {
  await client.end({ timeout: 5 });
};
