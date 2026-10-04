import { AiHint } from "@/components/ai/ai-hint";
import { getTrendsSummary, type Trends } from "@/lib/admin/trends";
import { RefreshSummaryButton } from "./refresh-summary-button";

// The server may run in UTC; ROPS reads Polish time.
const TIME = new Intl.DateTimeFormat("pl-PL", {
  timeZone: "Europe/Warsaw",
  hour: "2-digit",
  minute: "2-digit",
});

/** The AI summary over the counts; streamed in, so the tables never wait for the model. */
export async function WeeklySummary({ trends }: { trends: Trends }) {
  if (trends.total === 0) {
    return (
      <p className="text-muted-foreground">
        Podsumowanie pojawi się, gdy w tych tygodniach przyjdą pierwsze zgłoszenia.
      </p>
    );
  }

  let summary;
  try {
    summary = await getTrendsSummary(trends);
  } catch (error) {
    console.error("trends summary failed", error);
  }

  if (!summary) {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-destructive">
          Nie udało się przygotować podsumowania. Liczby poniżej są aktualne.
        </p>
        <RefreshSummaryButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AiHint
        targetType="trends_summary"
        targetId={`${trends.weeks.at(-1)!.start}@${summary.generatedAt}`}
      >
        <div className="flex flex-col gap-3">
          <ul className="flex max-w-[72ch] list-disc flex-col gap-2 pl-6">
            {summary.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          {summary.proposal && (
            <p className="max-w-[72ch]">
              <strong>Propozycja:</strong> {summary.proposal}
            </p>
          )}
        </div>
      </AiHint>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <RefreshSummaryButton />
        <p className="text-sm text-muted-foreground">
          Napisane o {TIME.format(new Date(summary.generatedAt))}. Odświeża się co godzinę.
        </p>
      </div>
    </div>
  );
}
