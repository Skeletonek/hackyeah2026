import { CategoryBadge } from "@/components/category-badge";
import { formatDate, formatTime } from "@/lib/dates";
import { inboxHref, type InboxRow, type SubmissionFilters } from "@/lib/admin/queries";
import {
  DuplicateChip,
  KindChip,
  PendingTriageChip,
  PriorityChip,
  StatusChip,
} from "./chips";
import { RetryTriageButton } from "./retry-triage-button";
import { RowLink } from "./row-link";

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
              <RowLink
                href={inboxHref(filters, row.id)}
                data-submission-id={row.id}
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
              </RowLink>

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