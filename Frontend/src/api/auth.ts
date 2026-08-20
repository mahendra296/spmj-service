import { apiGet, apiPost } from "./client";
import type { User } from "../types";

export const login = (email: string, password: string) =>
  apiPost<{ user: User }>("/auth/login", { email, password });

export const logout = () => apiPost<undefined>("/auth/logout");

export const me = () => apiGet<{ user: User | null }>("/auth/me");

export const getDashboard = () =>
  apiGet<{ counts: { events: number; posts: number; gallery: number } }>("/admin/dashboard");
