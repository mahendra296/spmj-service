/**
 * Turn a title into a URL-safe slug, e.g. "Annual STEM Camp 2024!" ->
 * "annual-stem-camp-2024". A short timestamp suffix keeps slugs unique.
 */
export const slugify = (text) => {
  return String(text)
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 200);
};

/**
 * A slug guaranteed to be unique enough for our scale by appending a
 * base-36 timestamp (and a small random tail).
 */
export const uniqueSlug = (text) => {
  const base = slugify(text) || "item";
  const suffix =
    Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  return `${base}-${suffix}`;
};
