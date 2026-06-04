import { db } from "../config/db.js";
import { blogPostsTable } from "../drizzle/schema.js";
import { eq, desc, count } from "drizzle-orm";
import { uniqueSlug } from "../utils/slugify.js";
import logger from "../utils/logger.js";

export const createBlogPost = async (data) => {
  logger.info("Invoke createBlogPost method");
  logger.info("Creating blog post with title: {}", data.title);
  try {
    const [post] = await db
      .insert(blogPostsTable)
      .values({ ...data, slug: uniqueSlug(data.title) })
      .returning();
    logger.info("Blog post created with id: {}", post.id);
    return post;
  } catch (error) {
    logger.error("Error while executing createBlogPost", error);
    throw error;
  }
};

export const updateBlogPost = async (id, data) => {
  logger.info("Invoke updateBlogPost method");
  logger.info("Updating blog post id: {}", id);
  try {
    const [post] = await db
      .update(blogPostsTable)
      .set(data)
      .where(eq(blogPostsTable.id, id))
      .returning();
    return post;
  } catch (error) {
    logger.error("Error while executing updateBlogPost", error);
    throw error;
  }
};

export const deleteBlogPost = async (id) => {
  logger.info("Invoke deleteBlogPost method");
  logger.info("Deleting blog post id: {}", id);
  try {
    await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  } catch (error) {
    logger.error("Error while executing deleteBlogPost", error);
    throw error;
  }
};

export const getBlogPostById = async (id) => {
  logger.info("Invoke getBlogPostById method");
  logger.info("Fetching blog post by id: {}", id);
  try {
    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, id));
    return post;
  } catch (error) {
    logger.error("Error while executing getBlogPostById", error);
    throw error;
  }
};

export const getBlogPostBySlug = async (slug) => {
  logger.info("Invoke getBlogPostBySlug method");
  logger.info("Fetching blog post by slug: {}", slug);
  try {
    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, slug));
    return post;
  } catch (error) {
    logger.error("Error while executing getBlogPostBySlug", error);
    throw error;
  }
};

/**
 * All posts, newest first — for the admin list.
 * Pass { limit, offset } to fetch a single page; omit for the full list.
 */
export const getAllBlogPosts = async ({ limit, offset = 0 } = {}) => {
  logger.info("Invoke getAllBlogPosts method");
  logger.info("Fetching blog posts limit: {} offset: {}", limit, offset);
  try {
    let query = db
      .select()
      .from(blogPostsTable)
      .orderBy(desc(blogPostsTable.publishedAt));
    if (limit != null) query = query.limit(limit).offset(offset);
    return await query;
  } catch (error) {
    logger.error("Error while executing getAllBlogPosts", error);
    throw error;
  }
};

/**
 * Published posts only — for the public blog.
 * Pass { limit, offset } to fetch a single page; omit for the full list.
 */
export const getPublishedBlogPosts = async ({ limit, offset = 0 } = {}) => {
  logger.info("Invoke getPublishedBlogPosts method");
  logger.info("Fetching published blog posts limit: {} offset: {}", limit, offset);
  try {
    let query = db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.published, true))
      .orderBy(desc(blogPostsTable.publishedAt));
    if (limit != null) query = query.limit(limit).offset(offset);
    return await query;
  } catch (error) {
    logger.error("Error while executing getPublishedBlogPosts", error);
    throw error;
  }
};

export const countBlogPosts = async () => {
  logger.info("Invoke countBlogPosts method");
  try {
    const [row] = await db.select({ value: count() }).from(blogPostsTable);
    return row?.value ?? 0;
  } catch (error) {
    logger.error("Error while executing countBlogPosts", error);
    throw error;
  }
};

export const countPublishedBlogPosts = async () => {
  logger.info("Invoke countPublishedBlogPosts method");
  try {
    const [row] = await db
      .select({ value: count() })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.published, true));
    return row?.value ?? 0;
  } catch (error) {
    logger.error("Error while executing countPublishedBlogPosts", error);
    throw error;
  }
};
