import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getAllBlogPosts,
  getPublishedBlogPosts,
  countBlogPosts,
  countPublishedBlogPosts,
} from "../service/blog-service.js";
import { validateBlogPost } from "../validators/blog-validator.js";
import { parsePage, parsePageSize, buildPagination, toPaginationMeta } from "../utils/pagination.js";
import { fieldErrors } from "../utils/zod-errors.js";
import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

/* ---------- Public ---------- */

export const getBlogPosts = async (req, res) => {
  const pageSize = parsePageSize(req.query.size);
  const totalCount = await countPublishedBlogPosts();
  const pagination = buildPagination({ page: parsePage(req.query.page), pageSize, totalCount });
  const posts = await getPublishedBlogPosts({ limit: pageSize, offset: pagination.offset });
  return res.json(ApiResponse.success({ posts, pagination: toPaginationMeta(pagination) }));
};

export const getBlogDetail = async (req, res) => {
  const post = await getBlogPostBySlug(req.params.slug);
  if (!post || !post.published) {
    return res.status(404).json(ApiResponse.error("Post not found."));
  }
  return res.json(ApiResponse.success({ post }));
};

/* ---------- Admin ---------- */

export const listBlogAdmin = async (req, res) => {
  const pageSize = parsePageSize(req.query.size);
  const totalCount = await countBlogPosts();
  const pagination = buildPagination({ page: parsePage(req.query.page), pageSize, totalCount });
  const posts = await getAllBlogPosts({ limit: pageSize, offset: pagination.offset });
  return res.json(ApiResponse.success({ posts, pagination: toPaginationMeta(pagination) }));
};

export const getBlogAdmin = async (req, res) => {
  const post = await getBlogPostById(Number(req.params.id));
  if (!post) return res.status(404).json(ApiResponse.error("Post not found."));
  return res.json(ApiResponse.success({ post }));
};

const buildBlogPayload = (body, file, userId) => {
  const data = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt || null,
    content: body.content,
    author: body.author || null,
    published: body.published === "on" || body.published === "true" || body.published === true,
  };
  if (file) data.coverImage = `/uploads/blog/${file.filename}`;
  if (userId) data.createdBy = userId;
  return data;
};

export const createBlogAdmin = async (req, res) => {
  const validation = validateBlogPost(req.body);
  if (!validation.success) {
    return res.status(400).json(ApiResponse.error("Validation failed", fieldErrors(validation)));
  }

  try {
    const post = await createBlogPost(buildBlogPayload(req.body, req.file, req.user?.id));
    return res.status(201).json(ApiResponse.success({ post }, "Post published."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not create the post."));
  }
};

export const updateBlogAdmin = async (req, res) => {
  const id = Number(req.params.id);
  const validation = validateBlogPost(req.body);
  if (!validation.success) {
    return res.status(400).json(ApiResponse.error("Validation failed", fieldErrors(validation)));
  }

  try {
    const post = await updateBlogPost(id, buildBlogPayload(req.body, req.file, undefined));
    if (!post) return res.status(404).json(ApiResponse.error("Post not found."));
    return res.json(ApiResponse.success({ post }, "Post updated."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not update the post."));
  }
};

export const deleteBlogAdmin = async (req, res) => {
  try {
    await deleteBlogPost(Number(req.params.id));
    return res.json(ApiResponse.successMessage("Post deleted."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not delete the post."));
  }
};
