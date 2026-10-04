import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Eye, Megaphone } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { formatDateWithYear } from "@/lib/dates";
import { isApplicationEmpty, parseApplication, parseCriteria, parseSections } from "@/lib/ideas/application";
import { callParam, ideaApplicationHref, ideaStepHref } from "@/lib/ideas/card";
import { getApplicationCall, getGrantApplication, getIdea, hasCallAlert } from "@/lib/ideas/queries";
import { submissionHref } from "@/lib/submissions/on-created";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { IdeaNotFound } from "../../_components/idea-not-found";
import { ApplicationForm } from "./_components/application-form";
import styles from "./_components/application.module.css";
import { CallAlertForm } from "./_components/call-alert-form";

const TITLE = "Wniosek grantowy";

export const metadata: Metadata = {
  title: TITLE,
  // A private draft: nothing here is for search engines.
  robots: { index: false, follow: false },
};

export default async function Page({ params, searchParams }: PageProps<"/ideas/[id]/application">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const callId = callParam(query.call);
  const idea = await getIdea(id);
  if (!idea) return <IdeaNotFound loginNext={ideaApplicationHref(id, callId)} />;

  const [call, user] = await Promise.all([getApplicationCall(callId), getCurrentUser()]);
  // RLS also shows admins other people's cards; only the author changes the application.
  const isAuthor = user?.id === idea.user_id;

  const heading = (
    <>
      <Button asChild variant="link" className={cn("self-start", styles.noPrint)}>
        <Link href={ideaStepHref(idea.id, 4, call?.id)}>
          <ArrowLeft aria-hidden strokeWidth={2} />
          Wróć do fiszki
        </Link>
      </Button>
      <h1 className="flex flex-col gap-1">
        <span className="text-base font-bold text-primary simple:text-simple-base">{TITLE}</span>
        <span className="text-h1 simple:text-simple-h1">{idea.title}</span>
      </h1>
    </>
  );

  if (!call) {
    return (
      <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-8 sm:px-8">
        {heading}
        <EmptyState
          title="Brak aktywnego naboru"
          action={
            <div className="flex w-full flex-col items-center gap-6">
              {user && (
                <CallAlertForm
                  ideaId={idea.id}
                  defaultEmail={user.email ?? ""}
                  subscribed={await hasCallAlert(user.id, idea.id)}
                />
              )}
              <Button asChild variant="outline">
                <Link href="/resources">Szukaj innych źródeł pieniędzy</Link>
              </Button>
            </div>
          }
        >
          <p>
            ROPS nie prowadzi teraz naboru wniosków. Zostaw e-mail, a damy Ci znać, gdy ruszy następny. Twoja fiszka jest
            zapisana i będzie gotowa do wniosku.
          </p>
        </EmptyState>
      </main>
    );
  }

  const application = await getGrantApplication(idea.id, call.id);
  const content = application ? parseApplication(application) : { fields: {}, criteria: {} };
  const submitted = application?.status === "submitted";

  let sent = null;
  if (application?.submission_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("submissions")
      .select("id, case_number, tracking_token")
      .eq("id", application.submission_id)
      .maybeSingle();
    sent = data;
  }

  return (
    <main
      id="main-content"
      className={cn("mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-8 sm:px-8", styles.page)}
    >
      {heading}

      <div className="flex items-start gap-3 rounded-lg bg-accent p-5 text-accent-foreground kontrast:border-2 kontrast:border-accent-foreground">
        <Megaphone aria-hidden className="mt-0.5 size-6 shrink-0" />
        <div>
          <p className="font-bold text-h4 simple:text-simple-h4">
            Trwa nabór: {call.title} — do {formatDateWithYear(call.closes_at)}
          </p>
          {call.description && <p className={styles.noPrint}>{call.description}</p>}
        </div>
      </div>

      {submitted ? (
        <Alert
          tone="success"
          title="Wniosek jest wysłany"
          className={styles.noPrint}
          action={
            sent && (
              <Button asChild variant="outline">
                <Link href={submissionHref(sent, user?.isAnonymous ?? true)}>
                  <Eye aria-hidden strokeWidth={2} />
                  Zobacz zgłoszenie
                </Link>
              </Button>
            )
          }
        >
          <p>
            {sent ? (
              <>
                Wniosek jest u ROPS jako zgłoszenie{" "}
                <strong className="font-mono whitespace-nowrap">{sent.case_number}</strong>.{" "}
              </>
            ) : (
              "Wniosek jest u ROPS. "
            )}
            Wysłanego wniosku nie można zmienić. Odpowiedź dostaniesz w zgłoszeniu.
          </p>
        </Alert>
      ) : isAuthor ? (
        <p className={cn("max-w-[68ch] text-muted-foreground", styles.noPrint)}>
          Wniosek wypełniliśmy z Twojej fiszki i kanwy. Pola od AI to propozycje: sprawdź je i popraw. Kwoty wpisujesz
          samodzielnie.
        </p>
      ) : (
        <Alert tone="info" title="Oglądasz wniosek autora" className={styles.noPrint}>
          <p>Pola wniosku zmienia tylko autor pomysłu.</p>
        </Alert>
      )}

      <ApplicationForm
        ideaId={idea.id}
        callId={call.id}
        sections={parseSections(call.sections)}
        criteria={parseCriteria(call.criteria)}
        initial={content}
        editable={isAuthor && !submitted}
        fillOnOpen={isAuthor && !submitted && isApplicationEmpty(content)}
      />
    </main>
  );
}
