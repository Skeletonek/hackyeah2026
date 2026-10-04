import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Page } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const ITEM =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border-2 px-3 font-bold simple:min-h-16 simple:min-w-16 simple:px-5 simple:text-simple-base";
const LINK = "border-input bg-card text-primary hover:border-primary hover:bg-secondary hover:text-secondary-foreground";
const CURRENT = "border-primary bg-primary text-primary-foreground";
const DISABLED = "border-muted bg-muted text-muted-foreground";

/** 1 … 4 5 6 … 20: the ends, the current page and its neighbours. */
function pageNumbers(page: number, count: number): (number | "gap")[] {
  const shown = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count));
  const sorted = [...shown].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ["gap" as const, n] : [n]));
}

/**
 * Pages of a server-rendered list as plain links (`?page=N`), so it works without
 * JavaScript, every page has its own URL and „wstecz” returns to it. The summary is
 * a live region: after a client-side page change a screen reader hears which results
 * are on screen now. Simple mode („Prościej”) keeps only Poprzednia / Następna.
 */
export function Pagination({
  page,
  href,
  label,
  className,
}: {
  page: Pick<Page<unknown>, "page" | "pageSize" | "total" | "pageCount">;
  href: (page: number) => string;
  /** The nav's accessible name, e.g. „Strony zgłoszeń”. */
  label: string;
  className?: string;
}) {
  const { page: current, pageSize, total, pageCount } = page;
  if (pageCount <= 1) return null;

  const first = (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, total);

  return (
    <nav aria-label={label} className={cn("flex flex-col gap-3", className)}>
      <p role="status" className="text-muted-foreground simple:text-simple-base">
        Strona {current} z {pageCount}: wyniki {first}–{last} z {total}
      </p>
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {current > 1 ? (
            <Link href={href(current - 1)} rel="prev" className={cn(ITEM, LINK)}>
              <ChevronLeft aria-hidden className="size-6" strokeWidth={2} />
              Poprzednia<span className="sr-only"> strona</span>
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(ITEM, DISABLED)}>
              <ChevronLeft aria-hidden className="size-6" strokeWidth={2} />
              Poprzednia<span className="sr-only"> strona</span>
            </span>
          )}
        </li>

        {pageNumbers(current, pageCount).map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground simple:hidden">
              …
            </li>
          ) : (
            <li key={n} className="simple:hidden">
              <Link
                href={href(n)}
                aria-current={n === current ? "page" : undefined}
                className={cn(ITEM, n === current ? CURRENT : LINK)}
              >
                <span className="sr-only">Strona </span>
                {n}
              </Link>
            </li>
          ),
        )}

        <li>
          {current < pageCount ? (
            <Link href={href(current + 1)} rel="next" className={cn(ITEM, LINK)}>
              Następna<span className="sr-only"> strona</span>
              <ChevronRight aria-hidden className="size-6" strokeWidth={2} />
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(ITEM, DISABLED)}>
              Następna<span className="sr-only"> strona</span>
              <ChevronRight aria-hidden className="size-6" strokeWidth={2} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
