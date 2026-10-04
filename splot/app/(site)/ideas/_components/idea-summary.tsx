import Link from "next/link";
import { ArrowLeft, Eye, FileText, LayoutGrid, Pencil } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatDateWithYear } from "@/lib/dates";
import { ideaApplicationHref, ideaCanvasHref, ideaStepHref, type Idea } from "@/lib/ideas/card";
import type { OpenGrantCall } from "@/lib/ideas/queries";
import { IDEA_ASSET_LABELS, IDEA_STAGE_LABELS, TARGET_GROUP_LABELS, type IdeaAsset } from "@/lib/labels";
import { sendIdeaToRops } from "../actions";
import { SendIdeaButton } from "./send-idea-button";

/** Step 4 (KRE4): the finished idea card and what the author can do with it. */
export function IdeaSummary({
  idea,
  call,
  submission,
  sendFailed,
}: {
  idea: Idea;
  call: OpenGrantCall | null;
  /** The advice submission, once the card was sent to ROPS. */
  submission: { caseNumber: string; href: string } | null;
  sendFailed: boolean;
}) {
  const callId = call?.id;
  const sendVariant = call ? "outline" : "default";
  const assets = idea.assets as IdeaAsset[];

  return (
    <div className="flex flex-col gap-8">
      <article className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm kontrast:border-2 simple:p-8">
        <h3 className="text-h3 simple:text-simple-h3">{idea.title}</h3>

        <CardSection title="Pomysł i problem" editHref={ideaStepHref(idea.id, 1, callId)}>
          <Row label="Na czym polega" value={idea.solution} />
          <Row label="Jaki problem rozwiązuje" value={idea.problem} />
        </CardSection>

        <CardSection title="Dla kogo" editHref={ideaStepHref(idea.id, 2, callId)}>
          <Row
            label="Kto skorzysta"
            value={idea.target_groups.map((group) => TARGET_GROUP_LABELS[group]).join(", ")}
          />
          {idea.audience && <Row label="Odbiorcy" value={idea.audience} />}
          <Row label="Gdzie" value={idea.location} />
          {idea.reach && <Row label="Ile osób skorzysta w pierwszym roku" value={idea.reach} />}
        </CardSection>

        <CardSection title="Na jakim etapie" editHref={ideaStepHref(idea.id, 3, callId)}>
          <Row label="Etap" value={idea.stage && IDEA_STAGE_LABELS[idea.stage]} />
          <Row
            label="Co już masz"
            value={assets.map((asset) => IDEA_ASSET_LABELS[asset]).join(", ") || "Jeszcze nic"}
          />
        </CardSection>
      </article>

      <section aria-labelledby="idea-next-heading" className="flex flex-col gap-4">
        <h3 id="idea-next-heading" className="text-h3 simple:text-simple-h3">
          Co dalej?
        </h3>
        {call && (
          <Alert tone="info" title={`Trwa nabór: ${call.title}`}>
            <p>Wnioski przyjmujemy do {formatDateWithYear(call.closes_at)}. Z tej fiszki przygotujesz wniosek.</p>
          </Alert>
        )}
        {sendFailed && !submission && (
          <Alert tone="error" title="Nie udało się wysłać fiszki">
            <p>Fiszka jest zapisana. Spróbuj wysłać ją jeszcze raz za chwilę.</p>
          </Alert>
        )}
        {/* The call the person came for goes first and gets the primary look. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {call && (
            <Button asChild size="lg">
              <Link href={ideaApplicationHref(idea.id, callId)}>
                <FileText aria-hidden strokeWidth={2} />
                Zrób wniosek w naborze
              </Link>
            </Button>
          )}
          {submission ? (
            <Button asChild size="lg" variant={sendVariant}>
              <Link href={submission.href} aria-describedby="idea-send-note">
                <Eye aria-hidden strokeWidth={2} />
                Zobacz zgłoszenie
              </Link>
            </Button>
          ) : (
            <form action={sendIdeaToRops.bind(null, idea.id)} className="contents">
              {callId && <input type="hidden" name="call" value={callId} />}
              <SendIdeaButton variant={sendVariant} />
            </form>
          )}
          <Button asChild size="lg" variant="outline">
            <Link href={ideaCanvasHref(idea.id)}>
              <LayoutGrid aria-hidden strokeWidth={2} />
              Zrób kanwę
            </Link>
          </Button>
          {!call && (
            <Button asChild size="lg" variant="outline">
              <Link href={ideaApplicationHref(idea.id)}>
                <FileText aria-hidden strokeWidth={2} />
                Zrób wniosek w naborze
              </Link>
            </Button>
          )}
        </div>
        <p id="idea-send-note" className="text-sm text-muted-foreground simple:text-simple-sm">
          {submission ? (
            <>
              Fiszka jest u ROPS jako zgłoszenie <strong className="font-mono whitespace-nowrap">{submission.caseNumber}</strong>.
              Możesz ją dalej zmieniać; ROPS widzi wersję z dnia wysłania.
            </>
          ) : (
            "ROPS przeczyta fiszkę i odpowie Ci w zgłoszeniu. Fiszkę możesz potem dalej zmieniać."
          )}
        </p>
      </section>

      <div>
        <Button asChild size="lg" variant="outline">
          <Link href={ideaStepHref(idea.id, 3, callId)}>
            <ArrowLeft aria-hidden strokeWidth={2} />
            Wstecz
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CardSection({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <h4 className="text-h4 simple:text-simple-h4">{title}</h4>
        <Button asChild variant="link" size="sm">
          <Link href={editHref}>
            <Pencil aria-hidden className="size-5" strokeWidth={2} />
            Zmień<span className="sr-only">: {title}</span>
          </Link>
        </Button>
      </div>
      <dl className="grid gap-3">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-sm font-bold text-muted-foreground simple:text-simple-sm">{label}</dt>
      <dd className="whitespace-pre-line">{value || <span className="text-muted-foreground">Do uzupełnienia</span>}</dd>
    </div>
  );
}
