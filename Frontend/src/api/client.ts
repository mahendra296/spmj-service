import type { ApiResponse, FieldErrors } from "../types";

export class ApiError extends Error {
  status: number;
  errors?: FieldErrors;

  constructor(message: string, status: number, errors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
}

/**
 * Thin fetch wrapper: always sends cookies (httpOnly access/refresh tokens),
 * unwraps the Backend's { success, message, data, timestamp } envelope, and
 * throws an ApiError (carrying field-level validation errors, if any) on
 * failure so callers can `catch` and render inline errors.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isFormData = false } = options;

  const init: RequestInit = {
    method,
    credentials: "include",
  };

  if (body !== undefined) {
    if (isFormData) {
      init.body = body as FormData;
    } else {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`/api${path}`, init);

  let json: ApiResponse<T> | null = null;
  try {
    json = await res.json();
  } catch {
    // No JSON body (e.g. a network-level failure) — fall through to a generic error.
  }

  if (!res.ok || !json || !json.success) {
    const message = json?.message || `Request failed (${res.status})`;
    const errors = (json?.data as { errors?: FieldErrors } | undefined)?.errors;
    throw new ApiError(message, res.status, errors);
  }

  return json.data as T;
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);
export const apiPost = <T>(path: string, body?: unknown, isFormData = false) =>
  apiRequest<T>(path, { method: "POST", body, isFormData });
export const apiPut = <T>(path: string, body?: unknown, isFormData = false) =>
  apiRequest<T>(path, { method: "PUT", body, isFormData });
export const apiDelete = <T>(path: string) => apiRequest<T>(path, { method: "DELETE" });
