import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Lightbulb } from "lucide-react";
import { StatusTimeline } from "@/components/status-timeline";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { formatDateWithYear } from "@/lib/dates";
import { ideaStepHref } from "@/lib/ideas/card";
import { SUBMISSION_KIND_LABELS } from "@/lib/labels";
import { getOwnSubmissionThread, getThreadForParticipant } from "@/lib/threads/queries";
import { SubmissionThread } from "./_components/submission-thread";

const TITLE = "Zgłoszenie";

export const metadata: Metadata = { title: TITLE };

/** KOM1 + KOM2: where the author's submission is, and the conversation with ROPS under it. */
export default async function Page({
  params,
  searchParams,
}: PageProps<"/account/submissions/[id]">) {
  const { id } = await params;
  const { thread: threadQueryParam } = await searchParams;
  const user = await requireUser(`/account/submissions/${id}`);

  const requestedThreadId =
    typeof threadQueryParam === "string" && threadQueryParam ? threadQueryParam : null;

  const thread = requestedThreadId
    ? await getThreadForParticipant(requestedThreadId, user.id)
    : await getOwnSubmissionThread(id, user.id);
  if (!thread) notFound();

  const { submission, threadId, messages } = thread;
  const cardHref = submission.kind !== "problem" && submission.ideaId ? ideaStepHref(submission.ideaId, 4) : null;

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 simple:text-simple-h1">Gdzie jest moje zgłoszenie</h1>
          <p className="text-lead simple:text-simple-lead">
            Numer zgłoszenia: <strong className="font-mono whitespace-nowrap">{submission.caseNumber}</strong>
          </p>
          <p className="text-muted-foreground">
            {SUBMISSION_KIND_LABELS[submission.kind]}, wysłane{" "}
            <time dateTime={submission.createdAt}>{formatDateWithYear(submission.createdAt)}</time>.
          </p>
        </div>

        {/* <details> opens without JS. */}
        <details className="group rounded-lg border-2 border-border bg-card">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-5 py-3 font-bold simple:min-h-16 [&::-webkit-details-marker]:hidden">
            Treść zgłoszenia
            <ChevronDown aria-hidden className="size-6 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" strokeWidth={2} />
          </summary>
          <p className="border-t-2 border-border px-5 py-4 break-words whitespace-pre-wrap">{submission.body}</p>
        </details>

        {cardHref && (
          <div>
            <Button asChild variant="outline">
              <Link href={cardHref}>
                <Lightbulb aria-hidden strokeWidth={2} />
                Zobacz fiszkę pomysłu
              </Link>
            </Button>
          </div>
        )}
      </div>

      <section aria-labelledby="timeline-heading" className="flex flex-col gap-4">
        <h2 id="timeline-heading" className="text-h2 simple:text-simple-h2">
          Na jakim etapie jest zgłoszenie
        </h2>
        <StatusTimeline status={submission.status} />
      </section>

      <section aria-labelledby="thread-heading" className="flex w-full max-w-[760px] flex-col gap-4">
        <h2 id="thread-heading" className="text-h2 simple:text-simple-h2">
          Rozmowa z ROPS
        </h2>
        {threadId ? (
          <SubmissionThread
            submissionId={submission.id}
            threadId={threadId}
            userId={user.id}
            initialMessages={messages}
          />
        ) : (
          <Alert tone="info" title="Rozmowa nie jest jeszcze dostępna">
            ROPS skontaktuje się z Tobą w sprawie tego zgłoszenia e-mailem.
          </Alert>
        )}
      </section>
    </main>
  );
}
