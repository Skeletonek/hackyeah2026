import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, MapPin, MessageSquare, Stethoscope } from "lucide-react";
import { AiHint } from "@/components/ai/ai-hint";
import { Button } from "@/components/ui/button";
import { getSubmissionDetail } from "@/lib/admin/queries";
import { toTranscript } from "@/lib/admin/transcript";
import { formatDateWithYear, formatTime } from "@/lib/dates";
import { countyName } from "@/lib/labels";
import { KindChip, PendingTriageChip, StatusChip } from "../_components/chips";
import { DuplicateBanner } from "../_components/duplicate-banner";
import { RetryTriageButton } from "../_components/retry-triage-button";
import { StatusForm } from "../_components/status-form";
import { Transcript } from "../_components/transcript";
import { TriageForm } from "../_components/triage-form";

// Metadata and the page share one read per request.
const loadSubmission = cache(getSubmissionDetail);

export async function generateMetadata({
  params,
}: PageProps<"/admin/submissions/[id]">): Promise<Metadata> {
  const row = await loadSubmission((await params).id);
  return { title: row ? `Zgłoszenie ${row.case_number}` : "Zgłoszenie" };
}

const sectionClassName = "flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5";

/** ADM1 detail: confirm the AI triage, set the status, read the conversation. */
export default async function SubmissionDetailPage({
  params,
}: PageProps<"/admin/submissions/[id]">) {
  const row = await loadSubmission((await params).id);
  if (!row) notFound();

  const transcript = toTranscript(row.messages);
  const place = [row.municipality, row.county ? countyName(row.county) : null]
    .filter(Boolean)
    .join(", ");
  const hasAiHint =
    Boolean(row.ai_summary) || row.suggestions.length > 0 || row.ai_needs_expert === true;

  return (
    <main id="main-content" className="flex flex-col gap-6 p-4 sm:p-8">
      <Link
        href={`/admin/submissions?selected=${row.id}`}
        className="inline-flex min-h-11 w-fit items-center gap-2 font-bold text-primary underline underline-offset-4"
      >
        <ArrowLeft aria-hidden className="size-5" strokeWidth={2} />
        Wróć do zgłoszeń
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1">
            Zgłoszenie <span className="font-mono">{row.case_number}</span>
          </h1>
          <KindChip kind={row.kind} />
          <StatusChip status={row.status} />
        </div>
        <p className="text-muted-foreground">
          Wysłane {formatDateWithYear(row.created_at)}, {formatTime(row.created_at)}
        </p>
      </header>

      {row.duplicate && (
        <DuplicateBanner
          submission={{ id: row.id, case_number: row.case_number }}
          duplicate={row.duplicate}
        />
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="body-heading" className={sectionClassName}>
            <h2 id="body-heading" className="text-h3">
              Opis zgłoszenia
            </h2>
            <p className="max-w-[68ch] whitespace-pre-wrap">{row.body}</p>
            {(place || row.contact_email) && (
              <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
                {place && (
                  <>
                    <dt className="flex items-center gap-2 font-bold">
                      <MapPin aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                      Miejsce
                    </dt>
                    <dd>{place}</dd>
                  </>
                )}
                {row.contact_email && (
                  <>
                    <dt className="font-bold">E-mail kontaktowy</dt>
                    <dd className="break-words">{row.contact_email}</dd>
                  </>
                )}
              </dl>
            )}
          </section>

          <section aria-labelledby="ai-heading" className={sectionClassName}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="ai-heading" className="text-h3">
                Ocena AI
              </h2>
              {row.ai_triaged_at ? null : <PendingTriageChip />}
            </div>

            {hasAiHint && (
              <AiHint targetType="submission_triage" targetId={row.id}>
                <div className="flex flex-col gap-4">
                  {row.ai_summary && <p className="max-w-[68ch]">{row.ai_summary}</p>}

                  {row.suggestions.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h3 className="font-bold">Sugerowane innowacje</h3>
                      <ul className="flex flex-col gap-1">
                        {row.suggestions.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={`/library/${item.slug}`}
                              className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                            >
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {row.ai_needs_expert && (
                    <p className="flex items-center gap-2 font-bold">
                      <Stethoscope aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                      Rozważ przypisanie eksperta
                    </p>
                  )}
                </div>
              </AiHint>
            )}

            {row.ai_triaged_at ? null : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  AI nie opisało jeszcze tego zgłoszenia.
                </p>
                <RetryTriageButton id={row.id} />
              </div>
            )}
          </section>

          {transcript.length > 0 && (
            <section aria-labelledby="transcript-heading" className={sectionClassName}>
              <h2 id="transcript-heading" className="text-h3">
                Rozmowa z asystentem
              </h2>
              <p className="text-sm text-muted-foreground">
                Tylko do odczytu. Tak autor opisał problem przed wysłaniem zgłoszenia.
              </p>
              <Transcript entries={transcript} submissionId={row.id} />
            </section>
          )}
        </div>

        <aside aria-label="Obsługa zgłoszenia" className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="triage-heading" className={sectionClassName}>
            <h2 id="triage-heading" className="text-h3">
              Kategoria i priorytet
            </h2>
            <TriageForm
              id={row.id}
              category={row.category}
              priority={row.priority}
              aiFilled={Boolean(row.ai_triaged_at)}
            />
          </section>

          <section aria-labelledby="status-heading" className={sectionClassName}>
            <h2 id="status-heading" className="text-h3">
              Status i odpowiedź
            </h2>
            <StatusForm id={row.id} status={row.status} />
            <div className="border-t-2 border-border pt-4">
              <Button asChild variant="secondary">
                <Link href={`/admin/messages?submission=${row.id}`}>
                  <MessageSquare aria-hidden strokeWidth={2} />
                  Odpowiedz w wątku
                </Link>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
