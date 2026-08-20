import {
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryItemById,
  getAllGalleryItems,
  countGalleryItems,
} from "../service/gallery-service.js";
import { validateGalleryItem } from "../validators/gallery-validator.js";
import { parsePage, parsePageSize, buildPagination, toPaginationMeta } from "../utils/pagination.js";
import { fieldErrors } from "../utils/zod-errors.js";
import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

/* ---------- Public ---------- */

export const getGallery = async (req, res) => {
  const pageSize = parsePageSize(req.query.size);
  const totalCount = await countGalleryItems();
  const pagination = buildPagination({ page: parsePage(req.query.page), pageSize, totalCount });
  const items = await getAllGalleryItems({ limit: pageSize, offset: pagination.offset });
  return res.json(ApiResponse.success({ items, pagination: toPaginationMeta(pagination) }));
};

/* ---------- Admin ---------- */

export const listGalleryAdmin = async (req, res) => {
  const pageSize = parsePageSize(req.query.size);
  const totalCount = await countGalleryItems();
  const pagination = buildPagination({ page: parsePage(req.query.page), pageSize, totalCount });
  const items = await getAllGalleryItems({ limit: pageSize, offset: pagination.offset });
  return res.json(ApiResponse.success({ items, pagination: toPaginationMeta(pagination) }));
};

export const getGalleryAdmin = async (req, res) => {
  const item = await getGalleryItemById(Number(req.params.id));
  if (!item) return res.status(404).json(ApiResponse.error("Media not found."));
  return res.json(ApiResponse.success({ item }));
};

/** Resolve the media source: a new upload wins, else a typed external URL. */
const resolveMediaUrl = (req) => {
  const uploadedUrl = req.file ? `/uploads/gallery/${req.file.filename}` : null;
  return uploadedUrl || req.body.mediaUrl || null;
};

export const createGalleryAdmin = async (req, res) => {
  const validation = validateGalleryItem(req.body);
  const mediaUrl = resolveMediaUrl(req);

  if (!validation.success) {
    return res.status(400).json(ApiResponse.error("Validation failed", fieldErrors(validation)));
  }
  if (!mediaUrl) {
    return res
      .status(400)
      .json(ApiResponse.error("Validation failed", { mediaUrl: "Upload a file or provide a media URL." }));
  }

  try {
    const item = await createGalleryItem({
      title: req.body.title || null,
      caption: req.body.caption || null,
      mediaType: req.body.mediaType,
      mediaUrl,
      eventId: req.body.eventId ? Number(req.body.eventId) : null,
      createdBy: req.user?.id ?? null,
    });
    return res.status(201).json(ApiResponse.success({ item }, "Media added to the gallery."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not add the media."));
  }
};

export const updateGalleryAdmin = async (req, res) => {
  const id = Number(req.params.id);
  const validation = validateGalleryItem(req.body);
  const mediaUrl = resolveMediaUrl(req);

  if (!validation.success) {
    return res.status(400).json(ApiResponse.error("Validation failed", fieldErrors(validation)));
  }
  if (!mediaUrl) {
    return res
      .status(400)
      .json(ApiResponse.error("Validation failed", { mediaUrl: "Upload a file or provide a media URL." }));
  }

  try {
    const item = await updateGalleryItem(id, {
      title: req.body.title || null,
      caption: req.body.caption || null,
      mediaType: req.body.mediaType,
      mediaUrl,
      eventId: req.body.eventId ? Number(req.body.eventId) : null,
    });
    if (!item) return res.status(404).json(ApiResponse.error("Media not found."));
    return res.json(ApiResponse.success({ item }, "Media updated."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not update the media."));
  }
};

export const deleteGalleryAdmin = async (req, res) => {
  try {
    await deleteGalleryItem(Number(req.params.id));
    return res.json(ApiResponse.successMessage("Media deleted."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not delete the media."));
  }
};
