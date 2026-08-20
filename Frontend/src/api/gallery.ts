import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { GalleryItem, PaginationMeta } from "../types";

export const getGallery = (page: number, size: number) =>
  apiGet<{ items: GalleryItem[]; pagination: PaginationMeta }>(`/gallery?page=${page}&size=${size}`);

export const listGalleryAdmin = (page: number, size: number) =>
  apiGet<{ items: GalleryItem[]; pagination: PaginationMeta }>(`/admin/gallery?page=${page}&size=${size}`);

export const getGalleryAdmin = (id: number) => apiGet<{ item: GalleryItem }>(`/admin/gallery/${id}`);

export const createGalleryItem = (form: FormData) =>
  apiPost<{ item: GalleryItem }>("/admin/gallery", form, true);

export const updateGalleryItem = (id: number, form: FormData) =>
  apiPut<{ item: GalleryItem }>(`/admin/gallery/${id}`, form, true);

export const deleteGalleryItem = (id: number) => apiDelete<undefined>(`/admin/gallery/${id}`);
