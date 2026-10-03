"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Handshake, MapPin } from "lucide-react";
import { AiHint } from "@/components/ai/ai-hint";
import { CategoryBadge } from "@/components/category-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { countyName } from "@/lib/labels";
import type { SimilarSubmission } from "@/lib/matchmaking/similar";
import { findSimilarSubmissions, requestConnection, type RequestConnectionResult } from "../actions";

function place({ municipality, county }: SimilarSubmission) {
  const parts = [municipality, county ? (countyName(county) ?? county) : null].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Małopolska";
}

function SimilarCard({ conversationId, submission }: { conversationId: string; submission: SimilarSubmission }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RequestConnectionResult | null>(null);
  const where = place(submission);

  async function connect() {
    setPending(true);
    try {
      setResult(await requestConnection({ conversationId, toSubmissionId: submission.id }));
    } catch {
      setResult({ ok: false, error: "Nie udało się przekazać prośby. Spróbuj jeszcze raz za chwilę." });
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm kontrast:border-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="inline-flex items-center gap-1.5 font-bold">
          <MapPin aria-hidden className="size-5 shrink-0" strokeWidth={2} />
          {where}
        </p>
        {submission.category && <CategoryBadge category={submission.category} />}
      </div>

      <AiHint targetType="submission_summary" targetId={submission.id}>
        <p>{submission.summary}</p>
      </AiHint>

      {result?.ok ? (
        <Alert
          tone="success"
          title="Przekazaliśmy prośbę do ROPS. Odezwiemy się w wątku zgłoszenia."
          action={
            <Button asChild variant="outline">
              <Link href={result.trackingUrl}>Zobacz zgłoszenie {result.caseNumber}</Link>
            </Button>
          }
        >
          <p>Zapisaliśmy Twój opis jako zgłoszenie, żeby ROPS mógł Was skontaktować.</p>
        </Alert>
      ) : (
        <>
          {result && <Alert tone="error" title={result.error} />}
          <div>
            <Button variant="outline" loading={pending} onClick={connect}>
              <Handshake aria-hidden strokeWidth={2} />
              Połącz się
              <span className="sr-only">: zgłoszenie z miejsca {where}</span>
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

/**
 * „Podobne zgłoszenia z innych gmin”: up to 3 cases with the place, category
 * and AI summary (never the body). Renders nothing until there is at least one;
 * hidden in simple mode.
 */
export function ResultsSimilar({ conversationId }: { conversationId: string }) {
  const headingId = useId();
  const [similar, setSimilar] = useState<SimilarSubmission[]>([]);

  useEffect(() => {
    let cancelled = false;
    findSimilarSubmissions(conversationId)
      .then((rows) => {
        if (!cancelled) setSimilar(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  if (similar.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 simple:hidden">
      <div className="flex flex-col gap-1">
        <h3 id={headingId} className="text-h3">
          Podobne zgłoszenia z innych gmin
        </h3>
        <p className="text-muted-foreground">
          Ktoś w Małopolsce opisał podobny problem. Możecie poszukać rozwiązania razem: ROPS Was
          skontaktuje.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {similar.map((submission) => (
          <SimilarCard key={submission.id} conversationId={conversationId} submission={submission} />
        ))}
      </ul>
    </section>
  );
}
