import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CircleCheck, CircleDot, Plus } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { CALL_STATUS_LABELS, type CallStatus } from "@/lib/admin/call-fields";
import { callsHref, listCallsAdmin, type CallAdminRow } from "@/lib/admin/calls";
import { formatDateWithYear } from "@/lib/dates";
import { parsePage } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const TITLE = "Nabory";

export const metadata: Metadata = { title: TITLE };

export default async function AdminCallsPage({ searchParams }: PageProps<"/admin/calls">) {
  const rows = await listCallsAdmin(parsePage(await searchParams));

  return (
    <main id="main-content" className="flex flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">{TITLE}</h1>
        <Button asChild>
          <Link href="/admin/calls/new">
            <Plus aria-hidden strokeWidth={2} />
            Dodaj nabór
          </Link>
        </Button>
      </div>

      <section aria-labelledby="calls-list-heading" className="flex flex-col gap-3">
        <h2 id="calls-list-heading" className="text-h3">
          Wszystkie nabory
          <span className="font-normal text-muted-foreground"> ({rows.total})</span>
        </h2>

        {rows.total === 0 ? (
          <EmptyState
            title="Brak naborów"
            action={
              <Button asChild variant="outline">
                <Link href="/admin/calls/new">Dodaj nabór</Link>
              </Button>
            }
          >
            Dodaj pierwszy nabór. Jego pola i kryteria zobaczą autorzy pomysłów, gdy będą pisać wniosek.
          </EmptyState>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {rows.items.map((row) => (
                <CallRow key={row.id} row={row} />
              ))}
            </ul>
            <Pagination page={rows} href={callsHref} label="Strony naborów" />
          </>
        )}
      </section>
    </main>
  );
}

function count(value: CallAdminRow["sections"]) {
  return Array.isArray(value) ? value.length : 0;
}

function CallRow({ row }: { row: CallAdminRow }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border-2 border-border bg-card p-4">
      <Link
        href={`/admin/calls/${row.id}`}
        className="w-fit text-lg font-bold text-primary underline underline-offset-4 hover:decoration-[3px]"
      >
        {row.title}
        <span className="sr-only"> — edytuj</span>
      </Link>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip status={row.status} />
        <span className="text-sm font-bold">
          {formatDateWithYear(row.opens_at)} – {formatDateWithYear(row.closes_at)}
        </span>
        {row.category && <CategoryBadge category={row.category} />}
        <span className="text-sm text-muted-foreground">
          Pola wniosku: {count(row.sections)}, kryteria: {count(row.criteria)}
        </span>
      </div>
    </li>
  );
}

const STATUS_CHIPS: Record<CallStatus, { icon: typeof CircleDot; className: string }> = {
  open: { icon: CircleDot, className: "border-success bg-success-soft text-success" },
  planned: { icon: CalendarClock, className: "border-info bg-info-soft text-info" },
  closed: { icon: CircleCheck, className: "border-border bg-muted text-muted-foreground" },
};

/** The status as icon + word, so colour is never the only carrier. */
function StatusChip({ status }: { status: CallStatus }) {
  const { icon: Icon, className } = STATUS_CHIPS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold kontrast:border-current",
        className,
      )}
    >
      <Icon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
      {CALL_STATUS_LABELS[status]}
    </span>
  );
}
