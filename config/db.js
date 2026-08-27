// MySQL database connection (Drizzle ORM + mysql2)

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.js";

const connectionString = process.env.MYSQL_DATABASE_URL;

const pool = mysql.createPool({
  uri: connectionString,
  connectionLimit: 10, // Maximum number of connections in the pool
  connectTimeout: 10000, // Timeout for connection attempts (ms)
});

export const db = drizzle(pool, { schema, mode: "default" });

// Close the connection pool (used by one-off scripts like the seeder)
export const closeDb = async () => {
  await pool.end();
};
