import Link from "next/link";
import { CategoryBadge } from "@/components/category-badge";
import { formatDate, formatTime } from "@/lib/dates";
import type { InboxRow, SubmissionFilters } from "@/lib/admin/queries";
import {
  DuplicateChip,
  KindChip,
  PendingTriageChip,
  PriorityChip,
  StatusChip,
} from "./chips";
import { RetryTriageButton } from "./retry-triage-button";

/** Current filters plus the row to preview, as a query string. */
function rowHref(filters: SubmissionFilters, selected: string | null, id: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (selected === id) params.set("selected", id);
  const query = params.toString();
  return query ? `/admin/submissions?${query}` : "/admin/submissions";
}

/**
 * The inbox list. Every row is a link to `?selected=<id>`, so selecting works
 * without JavaScript; the retry button sits beside the link, never inside it.
 */
export function InboxList({
  rows,
  filters,
  selectedId,
}: {
  rows: InboxRow[];
  filters: SubmissionFilters;
  selectedId: string | null;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const isSelected = row.id === selectedId;
        return (
          <li
            key={row.id}
            className={
              isSelected
                ? "rounded-lg border-2 border-primary bg-card p-4"
                : "rounded-lg border-2 border-border bg-card p-4"
            }
          >
            <div className="flex flex-wrap items-start gap-3">
              <Link
                href={rowHref(filters, selectedId, row.id)}
                aria-current={isSelected ? "true" : undefined}
                className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 rounded-md"
              >
                <span className="font-mono text-base font-bold text-primary underline underline-offset-4">
                  {row.case_number}
                </span>
                <KindChip kind={row.kind} />
                <StatusChip status={row.status} />
                {row.category ? (
                  <CategoryBadge category={row.category} />
                ) : (
                  <span className="text-sm text-muted-foreground">Brak kategorii</span>
                )}
                {row.priority ? <PriorityChip priority={row.priority} /> : null}
                {row.possible_duplicate_id ? <DuplicateChip /> : null}
                {row.ai_triaged_at ? null : <PendingTriageChip />}
                <span className="text-sm text-muted-foreground">
                  {formatDate(row.created_at)}, {formatTime(row.created_at)}
                </span>
                {isSelected ? <span className="sr-only">— wybrane zgłoszenie</span> : null}
              </Link>

              {row.ai_triaged_at ? null : (
                <div className="shrink-0">
                  <RetryTriageButton id={row.id} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}