import {
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryItemById,
  getGalleryAlbumBySlug,
  getGalleryMedia,
  addGalleryMedia,
  deleteGalleryMedia,
  refreshGalleryCover,
  getAllGalleryItems,
  countGalleryItems,
} from "../service/gallery-service.js";
import { getAllEvents } from "../service/event-service.js";
import {
  validateGalleryItem,
  parseMediaUrls,
} from "../validators/gallery-validator.js";
import { parsePage, parsePageSize, pageSizeQuery, buildPagination } from "../utils/pagination.js";
import {
  PAGE_SIZE_OPTIONS,
  MAX_GALLERY_FILES,
  MEDIA_TYPES,
} from "../config/constant.js";
import logger from "../utils/logger.js";

/* ---------- Public ---------- */

/** One album on its own page, with every photo and video in it. */
export const getGalleryDetailPage = async (req, res, next) => {
  try {
    const album = await getGalleryAlbumBySlug(req.params.slug);
    if (!album) return next();
    return res.render("gallery-detail", {
      title: `${album.title} — SPMJ Foundation`,
      page: "services",
      album,
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
    title: "Add Album — SPMJ Admin",
    page: "admin",
    formAction: "/admin/gallery",
    heading: "Add album",
    item: {},
    media: [],
    pending: [],
    events,
    maxFiles: MAX_GALLERY_FILES,
    errors: null,
  });
};

export const editGalleryForm = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [item, events] = await Promise.all([
      getGalleryItemById(id),
      getAllEvents(),
    ]);
    if (!item) return next();
    return res.render("admin/gallery/form", {
      title: "Edit Album — SPMJ Admin",
      page: "admin",
      formAction: `/admin/gallery/${item.id}`,
      heading: "Edit album",
      item,
      media: await getGalleryMedia(item.id),
      pending: [],
      events,
      maxFiles: MAX_GALLERY_FILES,
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
  const { media, invalid } = collectMedia(req);

  const baseOpts = {
    title: "Add Album — SPMJ Admin",
    page: "admin",
    formAction: "/admin/gallery",
    heading: "Add album",
    item: req.body,
    // A rejected create has nothing saved yet, so there is no album media to
    // list — only the uploads waiting to be attached.
    media: [],
    pending: media,
    events,
    maxFiles: MAX_GALLERY_FILES,
  };

  const errors = validation.success ? {} : fieldErrors(validation);
  if (invalid.length) errors.mediaUrls = urlError(invalid);
  if (!media.length && !errors.mediaUrls) {
    errors.mediaUrls = "Add at least one photo or video to the album.";
  }
  if (Object.keys(errors).length) {
    return renderFormError(res, 400, { ...baseOpts, errors });
  }

  try {
    const album = await createGalleryItem(
      {
        title: req.body.title.trim(),
        caption: req.body.caption || null,
        description: req.body.description || null,
        eventId: req.body.eventId ? Number(req.body.eventId) : null,
        createdBy: req.user?.id ?? null,
      },
      media
    );
    req.flash(
      "success",
      `Album created with ${media.length} ${media.length === 1 ? "item" : "items"}.`
    );
    return res.redirect(`/admin/gallery/${album.id}/edit`);
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not create the album.");
    return res.redirect("/admin/gallery/new");
  }
};

export const updateGalleryAdmin = async (req, res) => {
  const id = Number(req.params.id);
  const validation = validateGalleryItem(req.body);
  const events = await getAllEvents();
  const { media, invalid } = collectMedia(req);
  const removeIds = idList(req.body.removeMedia);

  const baseOpts = {
    title: "Edit Album — SPMJ Admin",
    page: "admin",
    formAction: `/admin/gallery/${id}`,
    heading: "Edit album",
    item: { ...req.body, id },
    media: await getGalleryMedia(id),
    pending: media,
    events,
    maxFiles: MAX_GALLERY_FILES,
  };

  const errors = validation.success ? {} : fieldErrors(validation);
  if (invalid.length) errors.mediaUrls = urlError(invalid);
  // An album with nothing in it has no cover to show on the grid, so the last
  // media can only go once something replaces it.
  const remaining = baseOpts.media.length - removeIds.length + media.length;
  if (remaining < 1) {
    errors.mediaUrls = "An album needs at least one photo or video.";
  }
  if (Object.keys(errors).length) {
    return renderFormError(res, 400, { ...baseOpts, errors });
  }

  try {
    await updateGalleryItem(id, {
      title: req.body.title.trim(),
      caption: req.body.caption || null,
      description: req.body.description || null,
      eventId: req.body.eventId ? Number(req.body.eventId) : null,
    });
    await deleteGalleryMedia(id, removeIds);
    await addGalleryMedia(id, media);
    await refreshGalleryCover(id);
    req.flash("success", "Album updated.");
    return res.redirect("/admin/gallery");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not update the album.");
    return res.redirect(`/admin/gallery/${id}/edit`);
  }
};

export const deleteGalleryAdmin = async (req, res) => {
  try {
    await deleteGalleryItem(Number(req.params.id));
    req.flash("success", "Album deleted.");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not delete the album.");
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

/** Multer only tells us the MIME type; the schema stores the broad kind. */
const kindOf = (mimetype) => (mimetype?.startsWith("video/") ? "video" : "image");

/**
 * The media being added in this request: anything carried over from a rejected
 * attempt, then every uploaded file, then any URLs pasted into the textarea.
 * Each pasted URL is tagged image or video by the dropdown, since the
 * extension alone (a YouTube link has none) is not enough to tell.
 */
const collectMedia = (req) => {
  const files = req.files || [];
  const { urls, invalid } = parseMediaUrls(req.body.mediaUrls);
  const urlType = req.body.urlMediaType === "video" ? "video" : "image";
  return {
    media: [
      ...parsePending(req.body.pendingMedia),
      ...files.map((file) => ({
        mediaType: kindOf(file.mimetype),
        mediaUrl: `/uploads/gallery/${file.filename}`,
      })),
      ...urls.map((url) => ({ mediaType: urlType, mediaUrl: url })),
    ],
    invalid,
  };
};

/**
 * Files are on disk the moment multer runs, so a form rejected for an unrelated
 * reason (no title, say) would strand them — a file input cannot be re-filled
 * from the server. The form echoes them back as "type|path" hidden fields
 * instead, which this reads. Only our own upload paths are accepted.
 */
const parsePending = (value) =>
  []
    .concat(value ?? [])
    .map((entry) => String(entry).split("|"))
    .filter(([type, url]) => MEDIA_TYPES.includes(type) && url?.startsWith("/uploads/gallery/"))
    .map(([mediaType, mediaUrl]) => ({ mediaType, mediaUrl }));

const urlError = (invalid) =>
  `Not a valid URL: ${invalid.slice(0, 3).join(", ")}`;

/** Checkbox groups arrive as a string when one is ticked, an array when many. */
const idList = (value) =>
  [].concat(value ?? []).map(Number).filter(Number.isInteger);
