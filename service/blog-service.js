import { db } from "../config/db.js";
import { blogPostsTable } from "../drizzle/schema.js";
import { eq, desc, count } from "drizzle-orm";
import { uniqueSlug } from "../utils/slugify.js";

export const createBlogPost = async (data) => {
  const [post] = await db
    .insert(blogPostsTable)
    .values({ ...data, slug: uniqueSlug(data.title) })
    .returning();
  return post;
};

export const updateBlogPost = async (id, data) => {
  const [post] = await db
    .update(blogPostsTable)
    .set(data)
    .where(eq(blogPostsTable.id, id))
    .returning();
  return post;
};

export const deleteBlogPost = async (id) => {
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
};

export const getBlogPostById = async (id) => {
  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.id, id));
  return post;
};

export const getBlogPostBySlug = async (slug) => {
  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.slug, slug));
  return post;
};

/**
 * All posts, newest first — for the admin list.
 * Pass { limit, offset } to fetch a single page; omit for the full list.
 */
export const getAllBlogPosts = async ({ limit, offset = 0 } = {}) => {
  let query = db
    .select()
    .from(blogPostsTable)
    .orderBy(desc(blogPostsTable.publishedAt));
  if (limit != null) query = query.limit(limit).offset(offset);
  return query;
};

/**
 * Published posts only — for the public blog.
 * Pass { limit, offset } to fetch a single page; omit for the full list.
 */
export const getPublishedBlogPosts = async ({ limit, offset = 0 } = {}) => {
  let query = db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.published, true))
    .orderBy(desc(blogPostsTable.publishedAt));
  if (limit != null) query = query.limit(limit).offset(offset);
  return query;
};

export const countBlogPosts = async () => {
  const [row] = await db.select({ value: count() }).from(blogPostsTable);
  return row?.value ?? 0;
};

export const countPublishedBlogPosts = async () => {
  const [row] = await db
    .select({ value: count() })
    .from(blogPostsTable)
    .where(eq(blogPostsTable.published, true));
  return row?.value ?? 0;
};
