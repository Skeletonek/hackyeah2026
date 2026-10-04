import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { AiHint } from "@/components/ai/ai-hint";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/category-badge";
import { formatDateWithYear, formatTime } from "@/lib/dates";
import { countyName } from "@/lib/labels";
import type { InboxRow } from "@/lib/admin/queries";
import {
  DuplicateChip,
  KindChip,
  PendingTriageChip,
  PriorityChip,
  StatusChip,
} from "./chips";
import { RetryTriageButton } from "./retry-triage-button";

function Place({ row }: { row: InboxRow }) {
  if (!row.municipality && !row.county) return null;
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      <MapPin aria-hidden className="size-5 shrink-0" strokeWidth={2} />
      {[row.municipality, row.county ? countyName(row.county) : null]
        .filter(Boolean)
        .join(", ")}
    </p>
  );
}

/**
 * The preview beside the list (ADM1). The full detail with the transcript and
 * the thread is A3, so this stays a short read.
 */
export function SubmissionPreview({ row }: { row: InboxRow }) {
  return (
    <article
      aria-labelledby="preview-heading"
      data-slot="submission-preview"
      className="flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5"
    >
      <div data-slot="submission-preview-header" className="flex flex-wrap items-center gap-3">
        <h2 id="preview-heading" className="font-mono text-h4">
          {row.case_number}
        </h2>
        <KindChip kind={row.kind} />
        <StatusChip status={row.status} />
      </div>

      <p className="text-muted-foreground">
        {formatDateWithYear(row.created_at)}, {formatTime(row.created_at)}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {row.category ? <CategoryBadge category={row.category} /> : null}
        {row.priority ? <PriorityChip priority={row.priority} /> : null}
        {row.possible_duplicate_id ? <DuplicateChip /> : null}
        {row.ai_triaged_at ? null : <PendingTriageChip />}
      </div>

      {row.possible_duplicate_id && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span>Również opisano tutaj:</span>
          <Link
            href={`/admin/submissions?selected=${row.possible_duplicate_id}`}
            className="inline-flex min-h-11 items-center gap-1 font-bold text-primary underline underline-offset-4"
          >
            Otwórz możliwy duplikat
            <ArrowRight aria-hidden className="size-5" strokeWidth={2} />
          </Link>
        </p>
      )}

      <Place row={row} />
      {row.contact_email ? <p className="break-words">{row.contact_email}</p> : null}

      <p className="max-w-[68ch] whitespace-pre-wrap">{row.body}</p>

      {row.ai_summary ? (
        <AiHint targetType="triage_summary" targetId={row.id}>
          <p className="max-w-[68ch]">{row.ai_summary}</p>
        </AiHint>
      ) : null}

      {row.ai_triaged_at ? null : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            AI nie opisało jeszcze tego zgłoszenia.
          </p>
          <RetryTriageButton id={row.id} />
        </div>
      )}

      <div data-slot="submission-preview-footer" className="border-t-2 border-border pt-4">
        <Button asChild variant="outline">
          <Link href={`/admin/submissions/${row.id}`}>
            Pełny widok
            <ArrowRight aria-hidden strokeWidth={2} />
          </Link>
        </Button>
      </div>
    </article>
  );
}