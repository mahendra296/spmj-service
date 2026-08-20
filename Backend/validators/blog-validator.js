import { z } from "zod";
import { BLOG_CATEGORIES } from "../config/constant.js";

export const blogSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title is too long"),
  category: z.enum(BLOG_CATEGORIES, {
    errorMap: () => ({ message: "Choose a valid category" }),
  }),
  excerpt: z
    .string()
    .trim()
    .max(500, "Excerpt is too long")
    .optional()
    .or(z.literal("")),
  content: z
    .string({ required_error: "Content is required" })
    .trim()
    .min(20, "Content must be at least 20 characters"),
  author: z
    .string()
    .trim()
    .max(255, "Author is too long")
    .optional()
    .or(z.literal("")),
  published: z.coerce.boolean().optional().default(true),
});

export const validateBlogPost = (data) => blogSchema.safeParse(data);
