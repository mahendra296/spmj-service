import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

// Role-based access control values: ROLE_ADMIN and ROLE_USER
export const userRoleEnum = pgEnum("user_role", ["ROLE_ADMIN", "ROLE_USER"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // argon2 password hash
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("ROLE_USER").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
