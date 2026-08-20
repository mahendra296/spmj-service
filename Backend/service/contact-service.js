import { db } from "../config/db.js";
import { contactSubmissionsTable } from "../drizzle/schema.js";
import { desc, count, eq } from "drizzle-orm";
import logger from "../utils/logger.js";

export const createContactSubmission = async (data) => {
  logger.info("Invoke createContactSubmission method");
  try {
    const [submission] = await db
      .insert(contactSubmissionsTable)
      .values(data)
      .returning();
    return submission;
  } catch (error) {
    logger.error("Error while executing createContactSubmission", error);
    throw error;
  }
};

/** Newest-first page of submissions for the admin list. */
export const getContactSubmissions = async ({ limit, offset = 0 } = {}) => {
  let query = db
    .select()
    .from(contactSubmissionsTable)
    .orderBy(desc(contactSubmissionsTable.createdAt));
  if (limit != null) query = query.limit(limit).offset(offset);
  return query;
};

export const countContactSubmissions = async () => {
  const [row] = await db.select({ value: count() }).from(contactSubmissionsTable);
  return row?.value ?? 0;
};

export const deleteContactSubmission = async (id) => {
  logger.info("Invoke deleteContactSubmission method");
  try {
    await db.delete(contactSubmissionsTable).where(eq(contactSubmissionsTable.id, id));
  } catch (error) {
    logger.error("Error while executing deleteContactSubmission", error);
    throw error;
  }
};
