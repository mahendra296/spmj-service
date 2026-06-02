import { db } from "../config/db.js";
import { galleryItemsTable, eventsTable } from "../drizzle/schema.js";
import { eq, desc, count } from "drizzle-orm";

export const createGalleryItem = async (data) => {
  const [item] = await db.insert(galleryItemsTable).values(data).returning();
  return item;
};

export const updateGalleryItem = async (id, data) => {
  const [item] = await db
    .update(galleryItemsTable)
    .set(data)
    .where(eq(galleryItemsTable.id, id))
    .returning();
  return item;
};

export const deleteGalleryItem = async (id) => {
  await db.delete(galleryItemsTable).where(eq(galleryItemsTable.id, id));
};

export const getGalleryItemById = async (id) => {
  const [item] = await db
    .select()
    .from(galleryItemsTable)
    .where(eq(galleryItemsTable.id, id));
  return item;
};

/**
 * All gallery items, newest first, with the linked event title (if any).
 * Used for both the public gallery and the admin list.
 */
export const getAllGalleryItems = async () => {
  return db
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
};

export const countGalleryItems = async () => {
  const [row] = await db.select({ value: count() }).from(galleryItemsTable);
  return row?.value ?? 0;
};
