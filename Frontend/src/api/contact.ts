import { apiGet, apiPost, apiDelete } from "./client";
import type { ContactSubmission, PaginationMeta } from "../types";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export const submitContact = (input: ContactInput) => apiPost<undefined>("/contact", input);

export const listContactAdmin = (page: number, size: number) =>
  apiGet<{ submissions: ContactSubmission[]; pagination: PaginationMeta }>(
    `/admin/contact?page=${page}&size=${size}`
  );

export const deleteContactSubmission = (id: number) => apiDelete<undefined>(`/admin/contact/${id}`);
