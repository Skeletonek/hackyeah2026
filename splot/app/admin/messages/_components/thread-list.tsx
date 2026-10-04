import Link from "next/link";
import { Reply } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import type { StaffThreadRow } from "@/lib/threads/queries";
import { cn } from "@/lib/utils";
import { KindChip, StatusChip } from "../../submissions/_components/chips";

/** The ROPS thread inbox. Every row is a link to `?submission=<id>`, so it works without JavaScript. */
export function ThreadList({ rows, selectedId }: { rows: StaffThreadRow[]; selectedId: string | null }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const isSelected = row.submissionId === selectedId;
        return (
          <li key={row.submissionId}>
            <Link
              href={`/admin/messages?submission=${row.submissionId}`}
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                "flex flex-col gap-2 rounded-lg border-2 bg-card p-4",
                isSelected ? "border-primary" : "border-border hover:border-primary",
              )}
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-mono text-base font-bold text-primary underline underline-offset-4">
                  {row.caseNumber}
                </span>
                <KindChip kind={row.kind} />
                <StatusChip status={row.status} />
                {row.awaitingReply && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-warning bg-warning-soft px-3 py-1 text-sm font-bold text-warning kontrast:border-current">
                    <Reply aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                    Czeka na odpowiedź
                  </span>
                )}
              </span>
              <span className="line-clamp-2 break-words">{row.preview}</span>
              <span className="text-sm text-muted-foreground">
                Ostatnia aktywność:{" "}
                <time dateTime={row.lastActivityAt}>{formatDateTime(row.lastActivityAt)}</time>
              </span>
              {isSelected && <span className="sr-only">— otwarty wątek</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
