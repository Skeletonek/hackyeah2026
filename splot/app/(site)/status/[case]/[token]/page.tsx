import type { Metadata } from "next";
import Link from "next/link";
import { ChatBubble } from "@/components/ai/chat-bubble";
import { EmptyState } from "@/components/empty-state";
import { StatusTimeline } from "@/components/status-timeline";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatDateWithYear } from "@/lib/dates";
import { SUBMISSION_KIND_LABELS } from "@/lib/labels";
import { trackSubmission } from "@/lib/threads/queries";

const TITLE = "Status zgłoszenia";

export const metadata: Metadata = {
  title: TITLE,
  // The address holds the secret token: keep it out of search engines and referrers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Page({ params }: PageProps<"/status/[case]/[token]">) {
  const { case: caseNumber, token } = await params;
  const [tracked, user] = await Promise.all([trackSubmission(caseNumber, token), getCurrentUser()]);

  if (!tracked) {
    return (
      <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-[760px] flex-col gap-6">
          <h1 className="text-h1 simple:text-simple-h1">Nie znaleziono zgłoszenia</h1>
          <p className="text-lead text-muted-foreground simple:text-simple-lead">
            Sprawdź, czy link jest cały. Najłatwiej skopiować go jeszcze raz z potwierdzenia zgłoszenia.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/status">Zgłoszenia z tej przeglądarki</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/match">Opisz problem</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const { submission, messages, ownSubmissionId } = tracked;
  const accountPath = ownSubmissionId ? `/account/submissions/${ownSubmissionId}` : null;
  // /account needs a real account; an anonymous author signs in first and lands on the thread.
  const canReply = accountPath !== null && user !== null && !user.isAnonymous;
  const loginNext = accountPath ?? "/account";

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-3">
        <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
        <p className="text-lead simple:text-simple-lead">
          Numer zgłoszenia: <strong className="font-mono whitespace-nowrap">{submission.caseNumber}</strong>
        </p>
        <p className="text-muted-foreground">
          {SUBMISSION_KIND_LABELS[submission.kind]}, wysłane{" "}
          <time dateTime={submission.createdAt}>{formatDateWithYear(submission.createdAt)}</time>. Ostatnia zmiana:{" "}
          <time dateTime={submission.updatedAt}>{formatDateTime(submission.updatedAt)}</time>.
        </p>
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

        {messages.length > 0 ? (
          <ol className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <li key={index}>
                <ChatBubble
                  from={message.isStaff ? "them" : "me"}
                  author={message.isStaff ? "ROPS" : "Ty"}
                  meta={<time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </ChatBubble>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="Nie ma jeszcze wiadomości" headingLevel="h3">
            <p>Gdy ROPS odpowie, wiadomość pojawi się tutaj.</p>
          </EmptyState>
        )}

        <div className="flex flex-col items-start gap-2">
          {canReply ? (
            <Button asChild size="lg">
              <Link href={accountPath}>Odpowiedz</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href={`/login?next=${encodeURIComponent(loginNext)}`}>Zaloguj się, aby odpowiedzieć</Link>
              </Button>
              <p className="text-sm text-muted-foreground simple:text-simple-sm">
                Czytać możesz bez konta. Konto jest potrzebne tylko do pisania.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
