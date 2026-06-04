/**
 * Pagination helpers shared by the public and admin list views.
 */

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../config/constant.js";

/** Normalise a raw page value (from a query string) to a positive integer. */
export const parsePage = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

/**
 * Resolve a requested page size to one of the allowed options. Anything not in
 * the whitelist (junk, or an abusive `?size=100000`) falls back to the default.
 */
export const parsePageSize = (value, options = PAGE_SIZE_OPTIONS, fallback = DEFAULT_PAGE_SIZE) => {
  const n = Number.parseInt(value, 10);
  return options.includes(n) ? n : fallback;
};

/**
 * The `size` query fragment to carry on links — only when the chosen size
 * differs from the default, so default-size URLs stay clean.
 */
export const pageSizeQuery = (pageSize, fallback = DEFAULT_PAGE_SIZE) =>
  pageSize !== fallback ? { size: pageSize } : {};

/**
 * Build pagination metadata for a list view. The returned object carries both
 * the DB slice info (`offset`, `pageSize`) and everything the pagination
 * partial needs to render links.
 *
 * @param {object}  opts
 * @param {number}  opts.page        Requested page (1-based; pass parsePage()).
 * @param {number}  opts.pageSize    Items per page.
 * @param {number}  opts.totalCount  Total rows available.
 * @param {string}  opts.baseUrl     Path links point at (e.g. "/admin/events").
 * @param {string} [opts.param]      Query param carrying the page number (default "page").
 * @param {object} [opts.query]      Other query params to preserve on every link.
 * @param {string} [opts.hash]       Optional URL fragment appended to links (e.g. "#past").
 */
export const buildPagination = ({
  page,
  pageSize,
  totalCount,
  baseUrl,
  param = "page",
  query = {},
  hash = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  // Clamp the requested page into range so an out-of-bounds ?page=999 still
  // renders the last page rather than an empty list.
  const current = Math.min(Math.max(page, 1), totalPages);
  const offset = (current - 1) * pageSize;
  return {
    page: current,
    pageSize,
    totalCount,
    totalPages,
    offset,
    hasPrev: current > 1,
    hasNext: current < totalPages,
    prevPage: current - 1,
    nextPage: current + 1,
    baseUrl,
    param,
    query,
    hash,
  };
};
