import type { PaginationMeta } from "../types";

interface Props {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

/** Windowed page-number range (window size 5, centred on current page). */
function pageWindow(current: number, totalPages: number, size = 5) {
  let start = Math.max(1, current - Math.floor(size / 2));
  const end = Math.min(totalPages, start + size - 1);
  start = Math.max(1, end - size + 1);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export default function Pagination({ pagination, onPageChange }: Props) {
  const { page, totalPages, hasPrev, hasNext } = pagination;
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      {hasPrev ? (
        <>
          <button type="button" className="page-link page-nav page-edge" title="First page" onClick={() => onPageChange(1)}>
            « First
          </button>
          <button type="button" className="page-link page-nav" aria-label="Previous page" onClick={() => onPageChange(page - 1)}>
            ‹ Prev
          </button>
        </>
      ) : (
        <>
          <span className="page-link page-nav page-edge is-disabled" aria-disabled="true">« First</span>
          <span className="page-link page-nav is-disabled" aria-disabled="true">‹ Prev</span>
        </>
      )}

      {pages[0] > 1 && <span className="page-ellipsis">…</span>}
      {pages.map((p) =>
        p === page ? (
          <span key={p} className="page-link is-current" aria-current="page">
            {p}
          </span>
        ) : (
          <button key={p} type="button" className="page-link" onClick={() => onPageChange(p)}>
            {p}
          </button>
        )
      )}
      {pages[pages.length - 1] < totalPages && <span className="page-ellipsis">…</span>}

      {hasNext ? (
        <>
          <button type="button" className="page-link page-nav" aria-label="Next page" onClick={() => onPageChange(page + 1)}>
            Next ›
          </button>
          <button type="button" className="page-link page-nav page-edge" title="Last page" onClick={() => onPageChange(totalPages)}>
            Last »
          </button>
        </>
      ) : (
        <>
          <span className="page-link page-nav is-disabled" aria-disabled="true">Next ›</span>
          <span className="page-link page-nav page-edge is-disabled" aria-disabled="true">Last »</span>
        </>
      )}
    </nav>
  );
}
