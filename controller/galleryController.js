import {
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryItemById,
  getAllGalleryItems,
  countGalleryItems,
} from "../service/gallery-service.js";
import { getAllEvents } from "../service/event-service.js";
import { validateGalleryItem } from "../validators/gallery-validator.js";
import { parsePage, parsePageSize, pageSizeQuery, buildPagination } from "../utils/pagination.js";
import { PAGE_SIZE_OPTIONS } from "../config/constant.js";
import logger from "../utils/logger.js";

/* ---------- Public ---------- */

export const getGalleryPage = async (req, res) => {
  try {
    const items = await getAllGalleryItems();
    return res.render("gallery", {
      title: "Gallery — SPMJ Foundation",
      page: "gallery",
      items,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

/* ---------- Admin ---------- */

export const listGalleryAdmin = async (req, res) => {
  try {
    const pageSize = parsePageSize(req.query.size);
    const totalCount = await countGalleryItems();
    const pagination = buildPagination({
      page: parsePage(req.query.page),
      pageSize,
      totalCount,
      baseUrl: "/admin/gallery",
      query: pageSizeQuery(pageSize),
    });
    const items = await getAllGalleryItems({
      limit: pageSize,
      offset: pagination.offset,
    });
    return res.render("admin/gallery/index", {
      title: "Manage Gallery — SPMJ Admin",
      page: "admin",
      items,
      pagination,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const newGalleryForm = async (req, res) => {
  const events = await getAllEvents();
  return res.render("admin/gallery/form", {
    title: "Add Media — SPMJ Admin",
    page: "admin",
    formAction: "/admin/gallery",
    heading: "Add media",
    item: {},
    events,
    errors: null,
  });
};

export const editGalleryForm = async (req, res, next) => {
  try {
    const [item, events] = await Promise.all([
      getGalleryItemById(Number(req.params.id)),
      getAllEvents(),
    ]);
    if (!item) return next();
    return res.render("admin/gallery/form", {
      title: "Edit Media — SPMJ Admin",
      page: "admin",
      formAction: `/admin/gallery/${item.id}`,
      heading: "Edit media",
      item,
      events,
      errors: null,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

const renderFormError = (res, status, opts) =>
  res.status(status).render("admin/gallery/form", opts);

export const createGalleryAdmin = async (req, res) => {
  const validation = validateGalleryItem(req.body);
  const events = await getAllEvents();

  // The media source is either a new upload, a typed external URL, or media
  // carried over from a previous attempt (existingMedia hidden field).
  const uploadedUrl = req.file ? `/uploads/gallery/${req.file.filename}` : null;
  const mediaUrl = uploadedUrl || req.body.mediaUrl || req.body.existingMedia;

  const baseOpts = {
    title: "Add Media — SPMJ Admin",
    page: "admin",
    formAction: "/admin/gallery",
    heading: "Add media",
    item: { ...req.body, mediaUrl },
    events,
  };

  if (!validation.success) {
    return renderFormError(res, 400, {
      ...baseOpts,
      errors: fieldErrors(validation),
    });
  }

  if (!mediaUrl) {
    return renderFormError(res, 400, {
      ...baseOpts,
      errors: { mediaUrl: "Upload a file or provide a media URL." },
    });
  }

  try {
    await createGalleryItem({
      title: req.body.title || null,
      caption: req.body.caption || null,
      mediaType: req.body.mediaType,
      mediaUrl,
      eventId: req.body.eventId ? Number(req.body.eventId) : null,
      createdBy: req.user?.id ?? null,
    });
    req.flash("success", "Media added to the gallery.");
    return res.redirect("/admin/gallery");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not add the media.");
    return res.redirect("/admin/gallery/new");
  }
};

export const updateGalleryAdmin = async (req, res) => {
  const id = Number(req.params.id);
  const validation = validateGalleryItem(req.body);
  const events = await getAllEvents();

  const uploadedUrl = req.file ? `/uploads/gallery/${req.file.filename}` : null;
  const mediaUrl = uploadedUrl || req.body.mediaUrl || req.body.existingMedia;

  const baseOpts = {
    title: "Edit Media — SPMJ Admin",
    page: "admin",
    formAction: `/admin/gallery/${id}`,
    heading: "Edit media",
    item: { ...req.body, id, mediaUrl },
    events,
  };

  if (!validation.success) {
    return renderFormError(res, 400, {
      ...baseOpts,
      errors: fieldErrors(validation),
    });
  }

  if (!mediaUrl) {
    return renderFormError(res, 400, {
      ...baseOpts,
      errors: { mediaUrl: "Upload a file or provide a media URL." },
    });
  }

  try {
    await updateGalleryItem(id, {
      title: req.body.title || null,
      caption: req.body.caption || null,
      mediaType: req.body.mediaType,
      mediaUrl,
      eventId: req.body.eventId ? Number(req.body.eventId) : null,
    });
    req.flash("success", "Media updated.");
    return res.redirect("/admin/gallery");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not update the media.");
    return res.redirect(`/admin/gallery/${id}/edit`);
  }
};

export const deleteGalleryAdmin = async (req, res) => {
  try {
    await deleteGalleryItem(Number(req.params.id));
    req.flash("success", "Media deleted.");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not delete the media.");
  }
  return res.redirect("/admin/gallery");
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
