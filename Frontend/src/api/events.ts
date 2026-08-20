import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { EventItem, PaginationMeta } from "../types";

export interface EventSection {
  items: EventItem[];
  pagination: PaginationMeta;
}

export const getEvents = (upPage: number, pastPage: number, size: number) =>
  apiGet<{ upcoming: EventSection; past: EventSection }>(
    `/events?upPage=${upPage}&pastPage=${pastPage}&size=${size}`
  );

export const getEventBySlug = (slug: string) =>
  apiGet<{ event: EventItem }>(`/events/${encodeURIComponent(slug)}`);

export const listEventsAdmin = (page: number, size: number) =>
  apiGet<{ events: EventItem[]; pagination: PaginationMeta }>(`/admin/events?page=${page}&size=${size}`);

export const getEventAdmin = (id: number) => apiGet<{ event: EventItem }>(`/admin/events/${id}`);

export const createEvent = (form: FormData) =>
  apiPost<{ event: EventItem }>("/admin/events", form, true);

export const updateEvent = (id: number, form: FormData) =>
  apiPut<{ event: EventItem }>(`/admin/events/${id}`, form, true);

export const deleteEvent = (id: number) => apiDelete<undefined>(`/admin/events/${id}`);

export const listEventsMeta = () =>
  apiGet<{ events: { id: number; title: string }[] }>("/admin/meta/events");
