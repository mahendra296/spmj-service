import { useCallback, useEffect, useState } from "react";
import type { PaginationMeta } from "../types";
import { DEFAULT_PAGE_SIZE } from "../constants";

/**
 * Drives a single paginated list: owns page/pageSize state, calls `fetcher`
 * whenever either changes, and exposes loading/error state. `fetcher` must
 * return `{ items, pagination }` — pass a small wrapper for endpoints whose
 * response uses a different key than `items` (e.g. `posts`, `donations`).
 */
export function usePagedList<T>(
  fetcher: (page: number, size: number) => Promise<{ items: T[]; pagination: PaginationMeta }>,
  initialSize = DEFAULT_PAGE_SIZE
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialSize);
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(page, pageSize);
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1); // changing the page size resets to page 1
  };

  return { items, pagination, page, pageSize, setPage, setPageSize, loading, error, reload: load };
}
