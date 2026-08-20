import { db } from "../config/db.js";
import { galleryItemsTable, eventsTable } from "../drizzle/schema.js";
import { eq, desc, count } from "drizzle-orm";
import logger from "../utils/logger.js";

export const createGalleryItem = async (data) => {
  logger.info("Invoke createGalleryItem method");
  logger.info("Creating gallery item of type: {}", data.mediaType);
  try {
    const [item] = await db.insert(galleryItemsTable).values(data).returning();
    logger.info("Gallery item created with id: {}", item.id);
    return item;
  } catch (error) {
    logger.error("Error while executing createGalleryItem", error);
    throw error;
  }
};

export const updateGalleryItem = async (id, data) => {
  logger.info("Invoke updateGalleryItem method");
  logger.info("Updating gallery item id: {}", id);
  try {
    const [item] = await db
      .update(galleryItemsTable)
      .set(data)
      .where(eq(galleryItemsTable.id, id))
      .returning();
    return item;
  } catch (error) {
    logger.error("Error while executing updateGalleryItem", error);
    throw error;
  }
};

export const deleteGalleryItem = async (id) => {
  logger.info("Invoke deleteGalleryItem method");
  logger.info("Deleting gallery item id: {}", id);
  try {
    await db.delete(galleryItemsTable).where(eq(galleryItemsTable.id, id));
  } catch (error) {
    logger.error("Error while executing deleteGalleryItem", error);
    throw error;
  }
};

export const getGalleryItemById = async (id) => {
  logger.info("Invoke getGalleryItemById method");
  logger.info("Fetching gallery item by id: {}", id);
  try {
    const [item] = await db
      .select()
      .from(galleryItemsTable)
      .where(eq(galleryItemsTable.id, id));
    return item;
  } catch (error) {
    logger.error("Error while executing getGalleryItemById", error);
    throw error;
  }
};

/**
 * All gallery items, newest first, with the linked event title (if any).
 * Used for both the public gallery and the admin list.
 */
export const getAllGalleryItems = async ({ limit, offset = 0 } = {}) => {
  logger.info("Invoke getAllGalleryItems method");
  logger.info("Fetching gallery items limit: {} offset: {}", limit, offset);
  try {
    let query = db
      .select({
        id: galleryItemsTable.id,
        title: galleryItemsTable.title,
        caption: galleryItemsTable.caption,
        mediaType: galleryItemsTable.mediaType,
        mediaUrl: galleryItemsTable.mediaUrl,
        eventId: galleryItemsTable.eventId,
        eventTitle: eventsTable.title,
        createdAt: galleryItemsTable.createdAt,
      })
      .from(galleryItemsTable)
      .leftJoin(eventsTable, eq(galleryItemsTable.eventId, eventsTable.id))
      .orderBy(desc(galleryItemsTable.createdAt));
    if (limit != null) query = query.limit(limit).offset(offset);
    return await query;
  } catch (error) {
    logger.error("Error while executing getAllGalleryItems", error);
    throw error;
  }
};

export const countGalleryItems = async () => {
  logger.info("Invoke countGalleryItems method");
  try {
    const [row] = await db.select({ value: count() }).from(galleryItemsTable);
    return row?.value ?? 0;
  } catch (error) {
    logger.error("Error while executing countGalleryItems", error);
    throw error;
  }
};
