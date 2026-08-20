import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getEventBySlug,
  getAllEvents,
  getUpcomingEvents,
  getPastEvents,
  countEvents,
  countUpcomingEvents,
  countPastEvents,
} from "../service/event-service.js";
import { validateEvent } from "../validators/event-validator.js";
import { parsePage, parsePageSize, buildPagination, toPaginationMeta } from "../utils/pagination.js";
import { fieldErrors } from "../utils/zod-errors.js";
import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

/* ---------- Public ---------- */

export const getEvents = async (req, res) => {
  const pageSize = parsePageSize(req.query.size);

  const [upCount, pastCount] = await Promise.all([
    countUpcomingEvents(),
    countPastEvents(),
  ]);

  const upPagination = buildPagination({
    page: parsePage(req.query.upPage),
    pageSize,
    totalCount: upCount,
  });
  const pastPagination = buildPagination({
    page: parsePage(req.query.pastPage),
    pageSize,
    totalCount: pastCount,
  });

  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ limit: pageSize, offset: upPagination.offset }),
    getPastEvents({ limit: pageSize, offset: pastPagination.offset }),
  ]);

  return res.json(
    ApiResponse.success({
      upcoming: { items: upcoming, pagination: toPaginationMeta(upPagination) },
      past: { items: past, pagination: toPaginationMeta(pastPagination) },
    })
  );
};

export const getEventDetail = async (req, res) => {
  const event = await getEventBySlug(req.params.slug);
  if (!event || !event.published) {
    return res.status(404).json(ApiResponse.error("Event not found."));
  }
  return res.json(ApiResponse.success({ event }));
};

/* ---------- Admin ---------- */

export const listEventsAdmin = async (req, res) => {
  const pageSize = parsePageSize(req.query.size);
  const totalCount = await countEvents();
  const pagination = buildPagination({
    page: parsePage(req.query.page),
    pageSize,
    totalCount,
  });
  const events = await getAllEvents({ limit: pageSize, offset: pagination.offset });
  return res.json(
    ApiResponse.success({ events, pagination: toPaginationMeta(pagination) })
  );
};

export const getEventAdmin = async (req, res) => {
  const event = await getEventById(Number(req.params.id));
  if (!event) return res.status(404).json(ApiResponse.error("Event not found."));
  return res.json(ApiResponse.success({ event }));
};

const buildEventPayload = (body, file, userId) => {
  const data = {
    title: body.title,
    summary: body.summary || null,
    description: body.description,
    location: body.location || null,
    eventDate: new Date(body.eventDate),
    published: body.published === "on" || body.published === "true" || body.published === true,
  };
  if (file) data.coverImage = `/uploads/events/${file.filename}`;
  if (userId) data.createdBy = userId;
  return data;
};

export const createEventAdmin = async (req, res) => {
  const validation = validateEvent(req.body);
  if (!validation.success) {
    return res.status(400).json(ApiResponse.error("Validation failed", fieldErrors(validation)));
  }

  try {
    const data = buildEventPayload(req.body, req.file, req.user?.id);
    const event = await createEvent(data);
    return res.status(201).json(ApiResponse.success({ event }, "Event created."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not create the event."));
  }
};

export const updateEventAdmin = async (req, res) => {
  const id = Number(req.params.id);
  const validation = validateEvent(req.body);
  if (!validation.success) {
    return res.status(400).json(ApiResponse.error("Validation failed", fieldErrors(validation)));
  }

  try {
    const data = buildEventPayload(req.body, req.file, undefined);
    const event = await updateEvent(id, data);
    if (!event) return res.status(404).json(ApiResponse.error("Event not found."));
    return res.json(ApiResponse.success({ event }, "Event updated."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not update the event."));
  }
};

export const deleteEventAdmin = async (req, res) => {
  try {
    await deleteEvent(Number(req.params.id));
    return res.json(ApiResponse.successMessage("Event deleted."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not delete the event."));
  }
};

/** Lightweight list for the Gallery admin form's "link to event" dropdown. */
export const listEventsMeta = async (req, res) => {
  const events = await getAllEvents();
  return res.json(
    ApiResponse.success({ events: events.map((e) => ({ id: e.id, title: e.title })) })
  );
};
