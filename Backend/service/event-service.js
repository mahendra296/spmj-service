import { db } from "../config/db.js";
import { eventsTable } from "../drizzle/schema.js";
import { eq, and, desc, asc, gte, lt, count } from "drizzle-orm";
import { uniqueSlug } from "../utils/slugify.js";
import logger from "../utils/logger.js";

export const createEvent = async (data) => {
  logger.info("Invoke createEvent method");
  logger.info("Creating event with title: {}", data.title);
  try {
    const [event] = await db
      .insert(eventsTable)
      .values({ ...data, slug: uniqueSlug(data.title) })
      .returning();
    logger.info("Event created with id: {}", event.id);
    return event;
  } catch (error) {
    logger.error("Error while executing createEvent", error);
    throw error;
  }
};

export const updateEvent = async (id, data) => {
  logger.info("Invoke updateEvent method");
  logger.info("Updating event id: {}", id);
  try {
    const [event] = await db
      .update(eventsTable)
      .set(data)
      .where(eq(eventsTable.id, id))
      .returning();
    return event;
  } catch (error) {
    logger.error("Error while executing updateEvent", error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  logger.info("Invoke deleteEvent method");
  logger.info("Deleting event id: {}", id);
  try {
    await db.delete(eventsTable).where(eq(eventsTable.id, id));
  } catch (error) {
    logger.error("Error while executing deleteEvent", error);
    throw error;
  }
};

export const getEventById = async (id) => {
  logger.info("Invoke getEventById method");
  logger.info("Fetching event by id: {}", id);
  try {
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, id));
    return event;
  } catch (error) {
    logger.error("Error while executing getEventById", error);
    throw error;
  }
};

export const getEventBySlug = async (slug) => {
  logger.info("Invoke getEventBySlug method");
  logger.info("Fetching event by slug: {}", slug);
  try {
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.slug, slug));
    return event;
  } catch (error) {
    logger.error("Error while executing getEventBySlug", error);
    throw error;
  }
};

/**
 * All events, newest first — for the admin list.
 * Pass { limit, offset } to fetch a single page; omit for the full list
 * (e.g. the gallery form's event dropdown needs every event).
 */
export const getAllEvents = async ({ limit, offset = 0 } = {}) => {
  logger.info("Invoke getAllEvents method");
  logger.info("Fetching events limit: {} offset: {}", limit, offset);
  try {
    let query = db.select().from(eventsTable).orderBy(desc(eventsTable.eventDate));
    if (limit != null) query = query.limit(limit).offset(offset);
    return await query;
  } catch (error) {
    logger.error("Error while executing getAllEvents", error);
    throw error;
  }
};

/** Predicate for published events whose date is still in the future. */
const upcomingWhere = () =>
  and(eq(eventsTable.published, true), gte(eventsTable.eventDate, new Date()));

/** Predicate for published events whose date has passed. */
const pastWhere = () =>
  and(eq(eventsTable.published, true), lt(eventsTable.eventDate, new Date()));

/** Published upcoming events (date in the future), soonest first. */
export const getUpcomingEvents = async ({ limit, offset = 0 } = {}) => {
  logger.info("Invoke getUpcomingEvents method");
  logger.info("Fetching upcoming events limit: {} offset: {}", limit, offset);
  try {
    let query = db
      .select()
      .from(eventsTable)
      .where(upcomingWhere())
      .orderBy(asc(eventsTable.eventDate));
    if (limit != null) query = query.limit(limit).offset(offset);
    return await query;
  } catch (error) {
    logger.error("Error while executing getUpcomingEvents", error);
    throw error;
  }
};

/** Published past events (date in the past), most recent first. */
export const getPastEvents = async ({ limit, offset = 0 } = {}) => {
  logger.info("Invoke getPastEvents method");
  logger.info("Fetching past events limit: {} offset: {}", limit, offset);
  try {
    let query = db
      .select()
      .from(eventsTable)
      .where(pastWhere())
      .orderBy(desc(eventsTable.eventDate));
    if (limit != null) query = query.limit(limit).offset(offset);
    return await query;
  } catch (error) {
    logger.error("Error while executing getPastEvents", error);
    throw error;
  }
};

export const countEvents = async () => {
  logger.info("Invoke countEvents method");
  try {
    const [row] = await db.select({ value: count() }).from(eventsTable);
    return row?.value ?? 0;
  } catch (error) {
    logger.error("Error while executing countEvents", error);
    throw error;
  }
};

export const countUpcomingEvents = async () => {
  logger.info("Invoke countUpcomingEvents method");
  try {
    const [row] = await db
      .select({ value: count() })
      .from(eventsTable)
      .where(upcomingWhere());
    return row?.value ?? 0;
  } catch (error) {
    logger.error("Error while executing countUpcomingEvents", error);
    throw error;
  }
};

export const countPastEvents = async () => {
  logger.info("Invoke countPastEvents method");
  try {
    const [row] = await db
      .select({ value: count() })
      .from(eventsTable)
      .where(pastWhere());
    return row?.value ?? 0;
  } catch (error) {
    logger.error("Error while executing countPastEvents", error);
    throw error;
  }
};
