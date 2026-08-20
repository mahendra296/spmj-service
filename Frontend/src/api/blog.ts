import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { BlogPost, PaginationMeta } from "../types";

export const getBlogPosts = (page: number, size: number) =>
  apiGet<{ posts: BlogPost[]; pagination: PaginationMeta }>(`/blog?page=${page}&size=${size}`);

export const getBlogPostBySlug = (slug: string) =>
  apiGet<{ post: BlogPost }>(`/blog/${encodeURIComponent(slug)}`);

export const listBlogAdmin = (page: number, size: number) =>
  apiGet<{ posts: BlogPost[]; pagination: PaginationMeta }>(`/admin/blog?page=${page}&size=${size}`);

export const getBlogAdmin = (id: number) => apiGet<{ post: BlogPost }>(`/admin/blog/${id}`);

export const createBlogPost = (form: FormData) => apiPost<{ post: BlogPost }>("/admin/blog", form, true);

export const updateBlogPost = (id: number, form: FormData) =>
  apiPut<{ post: BlogPost }>(`/admin/blog/${id}`, form, true);

export const deleteBlogPost = (id: number) => apiDelete<undefined>(`/admin/blog/${id}`);
