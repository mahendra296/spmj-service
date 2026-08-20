import { z } from "zod";

export const eventSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title is too long"),
  summary: z
    .string()
    .trim()
    .max(500, "Summary is too long")
    .optional()
    .or(z.literal("")),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters"),
  location: z
    .string()
    .trim()
    .max(255, "Location is too long")
    .optional()
    .or(z.literal("")),
  eventDate: z
    .string({ required_error: "Event date is required" })
    .min(1, "Event date is required"),
  published: z.coerce.boolean().optional().default(true),
});

export const validateEvent = (data) => eventSchema.safeParse(data);
