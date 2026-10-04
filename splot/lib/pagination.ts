import { redirect } from "next/navigation";

/**
 * Offset pagination for lists: `?page=N` in the URL, `.range()` + `count: "exact"`
 * in the query. One page per request, so nothing hits PostgREST's 1000-row cap.
 */

export const PAGE_SIZE = 20;

/** Deep enough for any list here; keeps the offset sane on a hand-edited URL. */
const MAX_PAGE = 10_000;

export type SearchParams = { [key: string]: string | string[] | undefined };

export type Page<T> = {
  items: T[];
  /** 1-based. */
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

/** `?page=` as a positive integer; anything else is page 1. */
export function parsePage(params: SearchParams): number {
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1;
}

/** The inclusive `[from, to]` row range of a page, as `.range()` takes it. */
export function pageRange(page: number, pageSize = PAGE_SIZE): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

export function pageCount(total: number, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * `href` for one page of the current URL: every other param stays (filters, the
 * selected row), page 1 drops `page` so the plain URL stays canonical.
 */
export function pageHref(pathname: string, params: SearchParams, page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (key !== "page" && first) search.set(key, first);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

type RangeResult<T> = {
  data: T[] | null;
  count: number | null;
  error: { code?: string; message: string } | null;
};

/**
 * A `.range()` response with `count: "exact"` as a Page. A page past the end
 * (PostgREST answers 416, PGRST103) redirects to the last page, so a stale
 * link after deletions still lands on results.
 */
export function toPage<T>(
  result: RangeResult<T>,
  page: number,
  options: { label: string; href: (page: number) => string; pageSize?: number },
): Page<T> {
  const pageSize = options.pageSize ?? PAGE_SIZE;
  const total = result.count ?? 0;
  const pages = pageCount(total, pageSize);
  if (result.error?.code === "PGRST103" || (page > pages && !result.error)) {
    redirect(options.href(pages));
  }
  if (result.error) throw new Error(`${options.label} failed: ${result.error.message}`);
  return { items: result.data ?? [], page, pageSize, total, pageCount: pages };
}

/** One page of an array that is already in memory (static data, a merged list). */
export function slicePage<T>(
  items: T[],
  page: number,
  href: (page: number) => string,
  pageSize = PAGE_SIZE,
): Page<T> {
  const pages = pageCount(items.length, pageSize);
  if (page > pages) redirect(href(pages));
  const [from, to] = pageRange(page, pageSize);
  return { items: items.slice(from, to + 1), page, pageSize, total: items.length, pageCount: pages };
}
