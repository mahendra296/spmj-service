import { db } from "../config/db.js";
import { eventsTable } from "../drizzle/schema.js";
import { eq, and, desc, asc, gte, lt, count } from "drizzle-orm";
import { uniqueSlug } from "../utils/slugify.js";

export const createEvent = async (data) => {
  const [event] = await db
    .insert(eventsTable)
    .values({ ...data, slug: uniqueSlug(data.title) })
    .returning();
  return event;
};

export const updateEvent = async (id, data) => {
  const [event] = await db
    .update(eventsTable)
    .set(data)
    .where(eq(eventsTable.id, id))
    .returning();
  return event;
};

export const deleteEvent = async (id) => {
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
};

export const getEventById = async (id) => {
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, id));
  return event;
};

export const getEventBySlug = async (slug) => {
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.slug, slug));
  return event;
};

/** All events, newest first — for the admin list. */
export const getAllEvents = async () => {
  return db.select().from(eventsTable).orderBy(desc(eventsTable.eventDate));
};

/** Published upcoming events (date in the future), soonest first. */
export const getUpcomingEvents = async () => {
  return db
    .select()
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.published, true),
        gte(eventsTable.eventDate, new Date())
      )
    )
    .orderBy(asc(eventsTable.eventDate));
};

/** Published past events (date in the past), most recent first. */
export const getPastEvents = async () => {
  return db
    .select()
    .from(eventsTable)
    .where(
      and(eq(eventsTable.published, true), lt(eventsTable.eventDate, new Date()))
    )
    .orderBy(desc(eventsTable.eventDate));
};

export const countEvents = async () => {
  const [row] = await db.select({ value: count() }).from(eventsTable);
  return row?.value ?? 0;
};
