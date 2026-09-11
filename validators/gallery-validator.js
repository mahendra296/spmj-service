import { z } from "zod";

/**
 * A gallery album. The media themselves are validated separately (see
 * `parseMediaUrls` in the controller) because they arrive as a mix of
 * uploaded files and pasted URLs; the album only needs a name to be saved.
 */
export const gallerySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the album a title")
    .max(255, "Title is too long"),
  caption: z
    .string()
    .trim()
    .max(500, "Caption is too long")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(5000, "Description is too long")
    .optional()
    .or(z.literal("")),
  eventId: z
    .union([z.coerce.number().int().positive(), z.literal("")])
    .optional(),
});

export const validateGalleryItem = (data) => gallerySchema.safeParse(data);

/**
 * Media URLs are restricted to http(s): anything else is unusable in an <img>
 * or <video>, and a stored "javascript:" URL would end up in the href of the
 * watch-video link on the album page.
 */
const isMediaUrl = (value) => {
  const parsed = z.string().trim().url().safeParse(value);
  if (!parsed.success) return false;
  try {
    const { protocol } = new URL(parsed.data);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Split the "paste media URLs" textarea into one entry per line, dropping
 * blanks. Returns the valid URLs and the lines that were not URLs at all, so
 * the form can report a typo instead of silently swallowing it.
 */
export const parseMediaUrls = (raw) => {
  const lines = String(raw || "")
    .split(/[\r\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const urls = [];
  const invalid = [];
  for (const line of lines) {
    if (isMediaUrl(line)) urls.push(line);
    else invalid.push(line);
  }
  return { urls, invalid };
};
