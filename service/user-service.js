import { db } from "../config/db.js";
import { usersTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { ROLES } from "../config/constant.js";

export const getUserById = async (userId) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  return user;
};

export const getUserByEmail = async (email) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};

/**
 * Create a user. `password` must already be hashed by the caller.
 * Defaults to the ROLE_USER role unless an admin role is supplied.
 */
export const createUser = async ({ name, email, password, role = ROLES.USER }) => {
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, password, role })
    .returning();

  return user;
};

/**
 * Insert a user, or update name/password/role if the email already exists.
 * Used by the seeder so it can be run repeatedly (idempotent).
 */
export const upsertUserByEmail = async ({ name, email, password, role }) => {
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, password, role })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: { name, password, role },
    })
    .returning();

  return user;
};
