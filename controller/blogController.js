import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getAllBlogPosts,
  getPublishedBlogPosts,
} from "../service/blog-service.js";
import { validateBlogPost } from "../validators/blog-validator.js";
import { BLOG_CATEGORIES } from "../config/constant.js";
import logger from "../utils/logger.js";

/* ---------- Public ---------- */

export const getBlogPage = async (req, res) => {
  try {
    const posts = await getPublishedBlogPosts();
    return res.render("blog", {
      title: "Blog & News — SPMJ Foundation",
      page: "blog",
      posts,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const getBlogDetailPage = async (req, res, next) => {
  try {
    const post = await getBlogPostBySlug(req.params.slug);
    if (!post || !post.published) return next();
    return res.render("blog-detail", {
      title: `${post.title} — SPMJ Foundation`,
      page: "blog",
      post,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

/* ---------- Admin ---------- */

export const listBlogAdmin = async (req, res) => {
  try {
    const posts = await getAllBlogPosts();
    return res.render("admin/blog/index", {
      title: "Manage Blog — SPMJ Admin",
      page: "admin",
      posts,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const newBlogForm = (req, res) => {
  return res.render("admin/blog/form", {
    title: "New Post — SPMJ Admin",
    page: "admin",
    formAction: "/admin/blog",
    heading: "Create post",
    post: {},
    categories: BLOG_CATEGORIES,
    errors: null,
  });
};

export const editBlogForm = async (req, res, next) => {
  try {
    const post = await getBlogPostById(Number(req.params.id));
    if (!post) return next();
    return res.render("admin/blog/form", {
      title: "Edit Post — SPMJ Admin",
      page: "admin",
      formAction: `/admin/blog/${post.id}`,
      heading: "Edit post",
      post,
      categories: BLOG_CATEGORIES,
      errors: null,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

const buildBlogPayload = (body, file, userId) => {
  const data = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt || null,
    content: body.content,
    author: body.author || null,
    published: body.published === "on" || body.published === "true",
  };
  // A new upload wins; otherwise keep whatever cover the form carried over
  // (existing DB value, or an upload from a previous validation attempt).
  if (file) data.coverImage = `/uploads/blog/${file.filename}`;
  else if (body.existingCover) data.coverImage = body.existingCover;
  if (userId) data.createdBy = userId;
  return data;
};

const carriedCover = (req) =>
  req.file ? `/uploads/blog/${req.file.filename}` : req.body.existingCover || null;

export const createBlogAdmin = async (req, res) => {
  const validation = validateBlogPost(req.body);
  if (!validation.success) {
    return res.status(400).render("admin/blog/form", {
      title: "New Post — SPMJ Admin",
      page: "admin",
      formAction: "/admin/blog",
      heading: "Create post",
      post: { ...req.body, coverImage: carriedCover(req) },
      categories: BLOG_CATEGORIES,
      errors: fieldErrors(validation),
    });
  }

  try {
    await createBlogPost(buildBlogPayload(req.body, req.file, req.user?.id));
    req.flash("success", "Post published.");
    return res.redirect("/admin/blog");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not create the post.");
    return res.redirect("/admin/blog/new");
  }
};

export const updateBlogAdmin = async (req, res) => {
  const id = Number(req.params.id);
  const validation = validateBlogPost(req.body);
  if (!validation.success) {
    return res.status(400).render("admin/blog/form", {
      title: "Edit Post — SPMJ Admin",
      page: "admin",
      formAction: `/admin/blog/${id}`,
      heading: "Edit post",
      post: { ...req.body, id, coverImage: carriedCover(req) },
      categories: BLOG_CATEGORIES,
      errors: fieldErrors(validation),
    });
  }

  try {
    await updateBlogPost(id, buildBlogPayload(req.body, req.file, undefined));
    req.flash("success", "Post updated.");
    return res.redirect("/admin/blog");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not update the post.");
    return res.redirect(`/admin/blog/${id}/edit`);
  }
};

export const deleteBlogAdmin = async (req, res) => {
  try {
    await deleteBlogPost(Number(req.params.id));
    req.flash("success", "Post deleted.");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not delete the post.");
  }
  return res.redirect("/admin/blog");
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
