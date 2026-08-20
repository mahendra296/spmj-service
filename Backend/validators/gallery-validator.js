import { z } from "zod";
import { MEDIA_TYPES } from "../config/constant.js";

export const gallerySchema = z.object({
  title: z
    .string()
    .trim()
    .max(255, "Title is too long")
    .optional()
    .or(z.literal("")),
  caption: z
    .string()
    .trim()
    .max(500, "Caption is too long")
    .optional()
    .or(z.literal("")),
  mediaType: z.enum(MEDIA_TYPES, {
    errorMap: () => ({ message: "Choose image or video" }),
  }),
  // The URL is optional here because an uploaded file can supply it instead;
  // the controller enforces that at least one source is present.
  mediaUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  eventId: z
    .union([z.coerce.number().int().positive(), z.literal("")])
    .optional(),
});

export const validateGalleryItem = (data) => gallerySchema.safeParse(data);
