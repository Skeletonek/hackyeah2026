import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatDateWithYear } from "@/lib/dates";
import { SUBMISSION_KIND_LABELS, SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/lib/labels";
import { trackingLink } from "@/lib/submissions/on-created";
import { listOwnSubmissions } from "@/lib/threads/queries";

const TITLE = "Sprawdź status zgłoszenia";

export const metadata: Metadata = { title: TITLE };

/** The author never sees „U eksperta”: like in StatusTimeline, it reads „W ocenie”. */
function statusLabel(status: SubmissionStatus) {
  return SUBMISSION_STATUS_LABELS[status === "with_expert" ? "in_review" : status];
}

export default async function Page() {
  const submissions = await listOwnSubmissions();

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
          <p className="text-lead text-muted-foreground simple:text-simple-lead">
            Tu są zgłoszenia wysłane z tej przeglądarki. Inne zgłoszenie otworzysz linkiem, który dostałeś
            po jego wysłaniu.
          </p>
        </div>

        {submissions.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {submissions.map((submission) => (
              <li
                key={submission.id}
                className="flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between simple:sm:flex-col simple:sm:items-start"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="font-mono text-h4 font-bold break-words simple:text-simple-h4">
                    {submission.caseNumber}
                  </h2>
                  <dl className="flex flex-col gap-1">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-muted-foreground">Rodzaj:</dt>
                      <dd>{SUBMISSION_KIND_LABELS[submission.kind]}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="font-bold">{statusLabel(submission.status)}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-muted-foreground">Wysłane:</dt>
                      <dd>
                        <time dateTime={submission.createdAt}>{formatDateWithYear(submission.createdAt)}</time>
                      </dd>
                    </div>
                  </dl>
                </div>
                <Button asChild variant="outline" className="shrink-0">
                  <Link href={trackingLink({ case_number: submission.caseNumber, tracking_token: submission.trackingToken })}>
                    Zobacz status
                    <span className="sr-only"> zgłoszenia {submission.caseNumber}</span>
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nie ma tu jeszcze zgłoszeń"
            action={
              <Button asChild size="lg">
                <Link href="/match">Opisz problem</Link>
              </Button>
            }
          >
            <p>
              Z tej przeglądarki nie wysłano jeszcze żadnego zgłoszenia. Opisz, co jest trudne, a poszukamy
              sprawdzonych rozwiązań.
            </p>
          </EmptyState>
        )}
      </div>
    </main>
  );
}
