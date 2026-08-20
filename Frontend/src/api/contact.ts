import { apiPost } from "./client";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export const submitContact = (input: ContactInput) => apiPost<undefined>("/contact", input);
