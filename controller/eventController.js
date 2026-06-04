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
import { parsePage, parsePageSize, pageSizeQuery, buildPagination } from "../utils/pagination.js";
import { PAGE_SIZE_OPTIONS } from "../config/constant.js";
import logger from "../utils/logger.js";

/* ---------- Public ---------- */

export const getEventsPage = async (req, res) => {
  try {
    // One page-size selector drives both sections; each section keeps its own
    // page number (?up= / ?past=).
    const pageSize = parsePageSize(req.query.size);
    const sizeQuery = pageSizeQuery(pageSize);

    const [upCount, pastCount] = await Promise.all([
      countUpcomingEvents(),
      countPastEvents(),
    ]);

    const upPagination = buildPagination({
      page: parsePage(req.query.up),
      pageSize,
      totalCount: upCount,
      baseUrl: "/events",
      param: "up",
      hash: "#upcoming",
    });
    const pastPagination = buildPagination({
      page: parsePage(req.query.past),
      pageSize,
      totalCount: pastCount,
      baseUrl: "/events",
      param: "past",
      hash: "#past",
    });

    // Each section's links preserve the chosen size and the other section's
    // page, so paging or resizing one doesn't reset the other.
    upPagination.query = { ...sizeQuery, ...(pastPagination.page > 1 ? { past: pastPagination.page } : {}) };
    pastPagination.query = { ...sizeQuery, ...(upPagination.page > 1 ? { up: upPagination.page } : {}) };

    const [upcoming, past] = await Promise.all([
      getUpcomingEvents({ limit: pageSize, offset: upPagination.offset }),
      getPastEvents({ limit: pageSize, offset: pastPagination.offset }),
    ]);

    return res.render("events", {
      title: "Events — SPMJ Foundation",
      page: "events",
      upcoming,
      past,
      upPagination,
      pastPagination,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const getEventDetailPage = async (req, res, next) => {
  try {
    const event = await getEventBySlug(req.params.slug);
    if (!event || !event.published) return next();
    return res.render("event-detail", {
      title: `${event.title} — SPMJ Foundation`,
      page: "events",
      event,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

/* ---------- Admin ---------- */

export const listEventsAdmin = async (req, res) => {
  try {
    const pageSize = parsePageSize(req.query.size);
    const totalCount = await countEvents();
    const pagination = buildPagination({
      page: parsePage(req.query.page),
      pageSize,
      totalCount,
      baseUrl: "/admin/events",
      query: pageSizeQuery(pageSize),
    });
    const events = await getAllEvents({
      limit: pageSize,
      offset: pagination.offset,
    });
    return res.render("admin/events/index", {
      title: "Manage Events — SPMJ Admin",
      page: "admin",
      events,
      pagination,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const newEventForm = (req, res) => {
  return res.render("admin/events/form", {
    title: "New Event — SPMJ Admin",
    page: "admin",
    formAction: "/admin/events",
    heading: "Create event",
    event: {},
    errors: null,
  });
};

export const editEventForm = async (req, res, next) => {
  try {
    const event = await getEventById(Number(req.params.id));
    if (!event) return next();
    return res.render("admin/events/form", {
      title: "Edit Event — SPMJ Admin",
      page: "admin",
      formAction: `/admin/events/${event.id}`,
      heading: "Edit event",
      event,
      errors: null,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

const buildEventPayload = (body, file, userId) => {
  const data = {
    title: body.title,
    summary: body.summary || null,
    description: body.description,
    location: body.location || null,
    eventDate: new Date(body.eventDate),
    published: body.published === "on" || body.published === "true",
  };
  // A freshly uploaded file wins; otherwise keep whatever cover the form
  // carried over (existing DB value, or an upload from a previous attempt
  // that failed validation). This stops a cover being lost on re-submit.
  if (file) data.coverImage = `/uploads/events/${file.filename}`;
  else if (body.existingCover) data.coverImage = body.existingCover;
  if (userId) data.createdBy = userId;
  return data;
};

// The cover to redisplay when a submit bounces on validation: a new upload,
// else whatever the form already carried.
const carriedCover = (req) =>
  req.file ? `/uploads/events/${req.file.filename}` : req.body.existingCover || null;

export const createEventAdmin = async (req, res) => {
  const validation = validateEvent(req.body);
  if (!validation.success) {
    return res.status(400).render("admin/events/form", {
      title: "New Event — SPMJ Admin",
      page: "admin",
      formAction: "/admin/events",
      heading: "Create event",
      event: { ...req.body, coverImage: carriedCover(req) },
      errors: fieldErrors(validation),
    });
  }

  try {
    const data = buildEventPayload(req.body, req.file, req.user?.id);
    await createEvent(data);
    req.flash("success", "Event created.");
    return res.redirect("/admin/events");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not create the event.");
    return res.redirect("/admin/events/new");
  }
};

export const updateEventAdmin = async (req, res) => {
  const id = Number(req.params.id);
  const validation = validateEvent(req.body);
  if (!validation.success) {
    return res.status(400).render("admin/events/form", {
      title: "Edit Event — SPMJ Admin",
      page: "admin",
      formAction: `/admin/events/${id}`,
      heading: "Edit event",
      event: { ...req.body, id, coverImage: carriedCover(req) },
      errors: fieldErrors(validation),
    });
  }

  try {
    const data = buildEventPayload(req.body, req.file, undefined);
    await updateEvent(id, data);
    req.flash("success", "Event updated.");
    return res.redirect("/admin/events");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not update the event.");
    return res.redirect(`/admin/events/${id}/edit`);
  }
};

export const deleteEventAdmin = async (req, res) => {
  try {
    await deleteEvent(Number(req.params.id));
    req.flash("success", "Event deleted.");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not delete the event.");
  }
  return res.redirect("/admin/events");
};

/* ---------- helpers ---------- */

const fieldErrors = (validation) => {
  const issues = validation.error.errors || validation.error.issues || [];
  const errors = {};
  for (const issue of issues) {
    const field = issue.path?.[0];
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
};
