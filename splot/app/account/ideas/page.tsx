import type { Metadata } from "next";
import Link from "next/link";
import { FileText, LayoutGrid, Lightbulb } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { formatDateWithYear } from "@/lib/dates";
import { ideaApplicationHref, ideaCanvasHref, ideaStepHref } from "@/lib/ideas/card";
import { listOwnIdeas } from "@/lib/ideas/queries";
import {
  IDEA_STAGE_LABELS,
  SUBMISSION_KIND_LABELS,
  SUBMISSION_STATUS_LABELS,
  type SubmissionStatus,
} from "@/lib/labels";

const TITLE = "Moje pomysły";

export const metadata: Metadata = { title: TITLE };

/** The author never sees „U eksperta”: like in StatusTimeline, it reads „W ocenie”. */
function statusLabel(status: SubmissionStatus) {
  return SUBMISSION_STATUS_LABELS[status === "with_expert" ? "in_review" : status];
}

export default async function Page() {
  const user = await requireUser("/account/ideas");
  const ideas = await listOwnIdeas(user.id);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
          <p className="text-lead text-muted-foreground simple:text-simple-lead">
            Tu są Twoje fiszki. Każdą możesz dalej zmieniać, także po wysłaniu do ROPS.
          </p>
        </div>

        {ideas.length > 0 ? (
          <>
            <ul className="flex flex-col gap-4">
              {ideas.map((idea) => (
                <li key={idea.id} className="flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="text-h4 font-bold break-words simple:text-simple-h4">
                      <Link
                        href={ideaStepHref(idea.id, 4)}
                        className="text-primary underline underline-offset-4 hover:decoration-[3px]"
                      >
                        {idea.title}
                      </Link>
                    </h2>
                    <dl className="flex flex-col gap-1">
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-muted-foreground">Etap:</dt>
                        <dd>{idea.stage ? IDEA_STAGE_LABELS[idea.stage] : "Do uzupełnienia"}</dd>
                      </div>
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-muted-foreground">Ostatnia zmiana:</dt>
                        <dd>
                          <time dateTime={idea.updatedAt}>{formatDateWithYear(idea.updatedAt)}</time>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {idea.submissions.length > 0 && (
                    <ul aria-label={`Zgłoszenia z fiszki ${idea.title}`} className="flex flex-wrap gap-2">
                      {idea.submissions.map((submission) => (
                        <li key={submission.id}>
                          <Link
                            href={`/account/submissions/${submission.id}`}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-info bg-info-soft px-4 py-1 text-sm font-bold text-info hover:border-foreground kontrast:border-current simple:min-h-16 simple:text-simple-sm"
                          >
                            {SUBMISSION_KIND_LABELS[submission.kind]} u ROPS: {statusLabel(submission.status)}
                            <span className="sr-only">, zgłoszenie {submission.caseNumber}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={ideaStepHref(idea.id, 4)}>
                        <Lightbulb aria-hidden strokeWidth={2} />
                        Fiszka<span className="sr-only">: {idea.title}</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={ideaCanvasHref(idea.id)}>
                        <LayoutGrid aria-hidden strokeWidth={2} />
                        Kanwa<span className="sr-only">: {idea.title}</span>
                      </Link>
                    </Button>
                    {idea.applications.map((application) => (
                      <Button key={application.id} asChild variant="outline" size="sm">
                        <Link href={ideaApplicationHref(idea.id, application.callId)}>
                          <FileText aria-hidden strokeWidth={2} />
                          Wniosek: {application.callTitle}
                          {!application.submitted && " (szkic)"}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div>
              <Button asChild>
                <Link href="/ideas/new">Opisz nowy pomysł</Link>
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="Nie masz jeszcze fiszek"
            headingLevel="h2"
            action={
              <Button asChild>
                <Link href="/ideas/new">Opisz pomysł</Link>
              </Button>
            }
          >
            <p>Fiszka to krótki opis pomysłu: na czym polega, dla kogo jest i na jakim jest etapie.</p>
          </EmptyState>
        )}
      </div>
    </main>
  );
}
