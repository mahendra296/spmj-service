import { db } from "../config/db.js";
import {
  galleryItemsTable,
  galleryMediaTable,
  eventsTable,
} from "../drizzle/schema.js";
import { eq, and, desc, asc, count, inArray, max } from "drizzle-orm";
import { uniqueSlug } from "../utils/slugify.js";
import { GALLERY_PREVIEW_COUNT } from "../config/constant.js";
import logger from "../utils/logger.js";

/** Columns of an album, plus the linked event's title. */
const albumColumns = {
  id: galleryItemsTable.id,
  title: galleryItemsTable.title,
  slug: galleryItemsTable.slug,
  caption: galleryItemsTable.caption,
  description: galleryItemsTable.description,
  mediaType: galleryItemsTable.mediaType,
  mediaUrl: galleryItemsTable.mediaUrl,
  eventId: galleryItemsTable.eventId,
  eventTitle: eventsTable.title,
  eventSlug: eventsTable.slug,
  createdAt: galleryItemsTable.createdAt,
};

const albumQuery = () =>
  db
    .select(albumColumns)
    .from(galleryItemsTable)
    .leftJoin(eventsTable, eq(galleryItemsTable.eventId, eventsTable.id));

/**
 * Create an album and its media in one go. `media` is an ordered list of
 * { mediaType, mediaUrl, caption? }; the first entry becomes the cover.
 */
export const createGalleryItem = async (data, media = []) => {
  logger.info("Invoke createGalleryItem method");
  logger.info("Creating gallery album: {} with {} media", data.title, media.length);
  const cover = media[0];
  // The album row carries its first media as the cover, so there is no such
  // thing as an empty album — callers must supply at least one.
  if (!cover) throw new Error("A gallery album needs at least one media item");
  try {
    const [result] = await db.insert(galleryItemsTable).values({
      ...data,
      slug: uniqueSlug(data.title),
      mediaType: cover.mediaType,
      mediaUrl: cover.mediaUrl,
    });
    await insertMedia(result.insertId, media, 0);
    logger.info("Gallery album created with id: {}", result.insertId);
    return await getGalleryItemById(result.insertId);
  } catch (error) {
    logger.error("Error while executing createGalleryItem", error);
    throw error;
  }
};

export const updateGalleryItem = async (id, data) => {
  logger.info("Invoke updateGalleryItem method");
  logger.info("Updating gallery album id: {}", id);
  try {
    await db.update(galleryItemsTable).set(data).where(eq(galleryItemsTable.id, id));
    return await getGalleryItemById(id);
  } catch (error) {
    logger.error("Error while executing updateGalleryItem", error);
    throw error;
  }
};

export const deleteGalleryItem = async (id) => {
  logger.info("Invoke deleteGalleryItem method");
  logger.info("Deleting gallery album id: {}", id);
  try {
    // gallery_media rows go with it via ON DELETE CASCADE.
    await db.delete(galleryItemsTable).where(eq(galleryItemsTable.id, id));
  } catch (error) {
    logger.error("Error while executing deleteGalleryItem", error);
    throw error;
  }
};

export const getGalleryItemById = async (id) => {
  logger.info("Invoke getGalleryItemById method");
  logger.info("Fetching gallery album by id: {}", id);
  try {
    const [item] = await albumQuery().where(eq(galleryItemsTable.id, id));
    return item;
  } catch (error) {
    logger.error("Error while executing getGalleryItemById", error);
    throw error;
  }
};

export const getGalleryItemBySlug = async (slug) => {
  logger.info("Invoke getGalleryItemBySlug method");
  logger.info("Fetching gallery album by slug: {}", slug);
  try {
    const [item] = await albumQuery().where(eq(galleryItemsTable.slug, slug));
    return item;
  } catch (error) {
    logger.error("Error while executing getGalleryItemBySlug", error);
    throw error;
  }
};

/** Every photo/video in one album, in display order. */
export const getGalleryMedia = async (galleryId) => {
  logger.info("Invoke getGalleryMedia method");
  logger.info("Fetching media for gallery album id: {}", galleryId);
  try {
    return await db
      .select()
      .from(galleryMediaTable)
      .where(eq(galleryMediaTable.galleryId, galleryId))
      .orderBy(asc(galleryMediaTable.sortOrder), asc(galleryMediaTable.id));
  } catch (error) {
    logger.error("Error while executing getGalleryMedia", error);
    throw error;
  }
};

/** An album together with its media — what the public detail page needs. */
export const getGalleryAlbumBySlug = async (slug) => {
  const album = await getGalleryItemBySlug(slug);
  if (!album) return null;
  return { ...album, media: await getGalleryMedia(album.id) };
};

/**
 * Append media to an existing album, continuing its sort order so the photos
 * already there keep their position.
 */
export const addGalleryMedia = async (galleryId, media = []) => {
  logger.info("Invoke addGalleryMedia method");
  logger.info("Adding {} media to gallery album id: {}", media.length, galleryId);
  if (!media.length) return;
  try {
    const [row] = await db
      .select({ value: max(galleryMediaTable.sortOrder) })
      .from(galleryMediaTable)
      .where(eq(galleryMediaTable.galleryId, galleryId));
    await insertMedia(galleryId, media, (row?.value ?? -1) + 1);
  } catch (error) {
    logger.error("Error while executing addGalleryMedia", error);
    throw error;
  }
};

/** Remove specific media rows from an album. */
export const deleteGalleryMedia = async (galleryId, mediaIds = []) => {
  logger.info("Invoke deleteGalleryMedia method");
  logger.info("Deleting {} media from gallery album id: {}", mediaIds.length, galleryId);
  if (!mediaIds.length) return;
  try {
    await db
      .delete(galleryMediaTable)
      .where(
        and(
          eq(galleryMediaTable.galleryId, galleryId),
          inArray(galleryMediaTable.id, mediaIds)
        )
      );
  } catch (error) {
    logger.error("Error while executing deleteGalleryMedia", error);
    throw error;
  }
};

/**
 * Point the album cover at its first remaining media. Called after media are
 * added or removed so the grid thumbnail never references a deleted row.
 * Returns how many media are left in the album.
 */
export const refreshGalleryCover = async (galleryId) => {
  logger.info("Invoke refreshGalleryCover method");
  logger.info("Refreshing cover for gallery album id: {}", galleryId);
  try {
    const media = await getGalleryMedia(galleryId);
    const cover = media[0];
    if (cover) {
      await db
        .update(galleryItemsTable)
        .set({ mediaType: cover.mediaType, mediaUrl: cover.mediaUrl })
        .where(eq(galleryItemsTable.id, galleryId));
    }
    return media.length;
  } catch (error) {
    logger.error("Error while executing refreshGalleryCover", error);
    throw error;
  }
};

/**
 * Albums, newest first, each carrying its media count and the first few media
 * for the combined preview tile. One extra query fetches the media for the
 * whole page, so the list stays at two round-trips whatever the page size.
 */
export const getAllGalleryItems = async ({ limit, offset = 0 } = {}) => {
  logger.info("Invoke getAllGalleryItems method");
  logger.info("Fetching gallery albums limit: {} offset: {}", limit, offset);
  try {
    let query = albumQuery().orderBy(desc(galleryItemsTable.createdAt));
    if (limit != null) query = query.limit(limit).offset(offset);
    const albums = await query;
    if (!albums.length) return albums;

    const media = await db
      .select()
      .from(galleryMediaTable)
      .where(
        inArray(
          galleryMediaTable.galleryId,
          albums.map((album) => album.id)
        )
      )
      .orderBy(asc(galleryMediaTable.sortOrder), asc(galleryMediaTable.id));

    const byAlbum = new Map();
    for (const row of media) {
      const list = byAlbum.get(row.galleryId);
      if (list) list.push(row);
      else byAlbum.set(row.galleryId, [row]);
    }
    return albums.map((album) => {
      const list = byAlbum.get(album.id) || [];
      return {
        ...album,
        media: list,
        mediaCount: list.length,
        previewMedia: list.slice(0, GALLERY_PREVIEW_COUNT),
      };
    });
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

/* ---------- helpers ---------- */

/** Insert an ordered batch of media rows starting at `startOrder`. */
const insertMedia = async (galleryId, media, startOrder) => {
  if (!media.length) return;
  await db.insert(galleryMediaTable).values(
    media.map((item, i) => ({
      galleryId,
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      caption: item.caption || null,
      sortOrder: startOrder + i,
    }))
  );
};
