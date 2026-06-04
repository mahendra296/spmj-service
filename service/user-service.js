import { db } from "../config/db.js";
import { usersTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { ROLES } from "../config/constant.js";
import logger from "../utils/logger.js";

export const getUserById = async (userId) => {
  logger.info("Invoke getUserById method");
  logger.info("Fetching user by id: {}", userId);
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    return user;
  } catch (error) {
    logger.error("Error while executing getUserById", error);
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  logger.info("Invoke getUserByEmail method");
  logger.info("Fetching user by email: {}", email);
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return user;
  } catch (error) {
    logger.error("Error while executing getUserByEmail", error);
    throw error;
  }
};

/**
 * Create a user. `password` must already be hashed by the caller.
 * Defaults to the ROLE_USER role unless an admin role is supplied.
 */
export const createUser = async ({ name, email, password, role = ROLES.USER }) => {
  logger.info("Invoke createUser method");
  logger.info("Creating user with email: {} role: {}", email, role);
  try {
    const [user] = await db
      .insert(usersTable)
      .values({ name, email, password, role })
      .returning();
    logger.info("User created with id: {}", user.id);
    return user;
  } catch (error) {
    logger.error("Error while executing createUser", error);
    throw error;
  }
};

/**
 * Insert a user, or update name/password/role if the email already exists.
 * Used by the seeder so it can be run repeatedly (idempotent).
 */
export const upsertUserByEmail = async ({ name, email, password, role }) => {
  logger.info("Invoke upsertUserByEmail method");
  logger.info("Upserting user with email: {} role: {}", email, role);
  try {
    const [user] = await db
      .insert(usersTable)
      .values({ name, email, password, role })
      .onConflictDoUpdate({
        target: usersTable.email,
        set: { name, password, role },
      })
      .returning();
    return user;
  } catch (error) {
    logger.error("Error while executing upsertUserByEmail", error);
    throw error;
  }
};
