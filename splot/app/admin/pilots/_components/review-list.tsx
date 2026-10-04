import Link from "next/link";
import { Star } from "lucide-react";
import { formatDateWithYear } from "@/lib/dates";
import type { ReviewRow, ReviewState } from "@/lib/admin/pilots";
import { ORGANIZATION_TYPE_LABELS, PILOT_RATING_LABELS } from "@/lib/labels";
import { ReviewDecision } from "./review-decision";

/** Reviews as cards: the free text needs room, a table row would squeeze it. */
export function ReviewList({ rows, state }: { rows: ReviewRow[]; state: ReviewState }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const { innovation } = row.pilot;
        const rating = row.rating as keyof typeof PILOT_RATING_LABELS;
        return (
          <li key={row.id}>
            <article
              aria-labelledby={`review-${row.id}`}
              className="flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5"
            >
              <header className="flex flex-col gap-1">
                <h3 id={`review-${row.id}`} className="text-h4">
                  <Link
                    href={`/library/${innovation.slug}`}
                    className="text-primary underline underline-offset-4 hover:decoration-[3px]"
                  >
                    {innovation.title}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ORGANIZATION_TYPE_LABELS[row.pilot.organization_type]}, {row.pilot.municipality} ·{" "}
                  {formatDateWithYear(row.created_at)}
                </p>
              </header>

              <p className="inline-flex items-center gap-2 font-bold">
                <Star aria-hidden className="size-6 shrink-0 fill-current text-warning" strokeWidth={2} />
                Ocena: {row.rating} z 5 — {PILOT_RATING_LABELS[rating]}
              </p>

              <dl className="grid gap-3 sm:grid-cols-[max-content_minmax(0,1fr)] sm:gap-x-6">
                <dt className="font-bold">Opinia</dt>
                <dd className="max-w-[68ch] whitespace-pre-line">
                  {row.feedback?.trim() || <span className="text-muted-foreground">Brak</span>}
                </dd>
                <dt className="font-bold">Usprawnienie</dt>
                <dd className="max-w-[68ch] whitespace-pre-line">
                  {row.improvement?.trim() || <span className="text-muted-foreground">Brak</span>}
                </dd>
                <dt className="font-bold">Podpis</dt>
                <dd>{row.attribution}</dd>
              </dl>

              <ReviewDecision
                id={row.id}
                state={state}
                label={`opinia ${row.attribution} o „${innovation.title}”`}
              />
            </article>
          </li>
        );
      })}
    </ul>
  );
}
