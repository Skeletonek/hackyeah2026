import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth";
import { formatDateWithYear } from "@/lib/dates";
import { parsePage } from "@/lib/pagination";
import { getStaffThread, listStaffThreads, staffThreadsHref } from "@/lib/threads/queries";
import { cn } from "@/lib/utils";
import { KindChip, StatusChip } from "../submissions/_components/chips";
import { StaffThread } from "./_components/staff-thread";
import { ThreadList } from "./_components/thread-list";
import { ThreadListRefresh } from "./_components/thread-list-refresh";

const TITLE = "Wiadomości";

export const metadata: Metadata = { title: TITLE };

/** The ROPS thread inbox: every thread on the left, the opened one with the reply box on the right. */
export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const user = await requireRole(["admin"], "/admin/messages");
  const params = await searchParams;
  const selected = Array.isArray(params.submission) ? params.submission[0] : params.submission;
  const page = parsePage(params);

  const [rows, thread] = await Promise.all([
    listStaffThreads(page, selected),
    selected ? getStaffThread(selected, user.id) : Promise.resolve(null),
  ]);

  return (
    <main id="main-content" className="flex flex-col gap-6 p-4 sm:p-8">
      <ThreadListRefresh />

      <h1 className="text-h1">{TITLE}</h1>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Below xl one pane at a time: the list, or the opened thread. */}
        <section
          aria-labelledby="threads-heading"
          className={cn("flex-col gap-3", selected ? "hidden xl:flex" : "flex")}
        >
          <h2 id="threads-heading" className="text-h3">
            Wątki
            <span className="font-normal text-muted-foreground">
              {" "}
              ({rows.total}, czeka na odpowiedź: {rows.awaiting})
            </span>
          </h2>
          {rows.total === 0 ? (
            <EmptyState title="Brak wątków" headingLevel="h3">
              Wątek powstaje razem ze zgłoszeniem. Gdy ktoś opisze problem albo wyśle pomysł,
              rozmowa pojawi się tutaj.
            </EmptyState>
          ) : (
            <>
              <ThreadList rows={rows.items} page={page} selectedId={thread?.submission.id ?? null} />
              <Pagination page={rows} href={(n) => staffThreadsHref(n)} label="Strony wątków" />
            </>
          )}
        </section>

        <section
          {...(thread ? { "aria-labelledby": "thread-heading" } : { "aria-label": "Otwarty wątek" })}
          className={cn("min-w-0 flex-col gap-5", selected ? "flex" : "hidden xl:flex")}
        >
          {selected && (
            <Link
              href={staffThreadsHref(page)}
              className="inline-flex min-h-11 w-fit items-center gap-2 font-bold text-primary underline underline-offset-4 xl:hidden"
            >
              <ArrowLeft aria-hidden className="size-5" strokeWidth={2} />
              Wróć do listy wątków
            </Link>
          )}

          {thread ? (
            <div className="flex flex-col gap-5 rounded-lg border-2 border-border bg-card p-5">
              <header className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 id="thread-heading" className="text-h3">
                    Zgłoszenie <span className="font-mono">{thread.submission.caseNumber}</span>
                  </h2>
                  <KindChip kind={thread.submission.kind} />
                  <StatusChip status={thread.submission.status} />
                </div>
                <p className="text-muted-foreground">
                  Wysłane{" "}
                  <time dateTime={thread.submission.createdAt}>
                    {formatDateWithYear(thread.submission.createdAt)}
                  </time>
                  {thread.submission.municipality ? `, ${thread.submission.municipality}` : ""}.{" "}
                  <Link
                    href={`/admin/submissions/${thread.submission.id}`}
                    className="inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-4"
                  >
                    Otwórz zgłoszenie
                  </Link>
                </p>
              </header>

              {/* <details> opens without JS. */}
              <details className="group rounded-lg border-2 border-border">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-5 py-3 font-bold [&::-webkit-details-marker]:hidden">
                  Treść zgłoszenia
                  <ChevronDown
                    aria-hidden
                    className="size-6 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    strokeWidth={2}
                  />
                </summary>
                <p className="border-t-2 border-border px-5 py-4 break-words whitespace-pre-wrap">
                  {thread.submission.body}
                </p>
              </details>

              {thread.threadId ? (
                <StaffThread
                  key={thread.threadId}
                  submissionId={thread.submission.id}
                  threadId={thread.threadId}
                  authorId={thread.submission.authorId}
                  userId={user.id}
                  initialMessages={thread.messages}
                />
              ) : (
                <Alert tone="info" title="To zgłoszenie nie ma wątku">
                  Odpowiedz autorowi e-mailem.
                </Alert>
              )}
            </div>
          ) : selected ? (
            <Alert tone="warning" title="Nie znaleziono wątku">
              To zgłoszenie nie istnieje albo zostało usunięte. Wybierz wątek z listy.
            </Alert>
          ) : (
            <EmptyState headingLevel="h2" title="Wybierz wątek">
              Kliknij wątek z listy, aby przeczytać rozmowę i odpowiedzieć autorowi.
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
