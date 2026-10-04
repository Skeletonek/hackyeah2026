import Link from "next/link";
import { MessageSquareQuote, PenLine, Star, TestTubeDiagonal } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PILOT_STATUS_LABELS } from "@/lib/labels";
import { getPublicPilotReviews, getUserPilot } from "@/lib/library/pilots";
import { type PilotStats } from "@/lib/library/innovation";

export async function TesterAside({
  innovationId,
  innovationSlug,
  pilotSlots,
  stats,
}: {
  innovationId: string;
  innovationSlug: string;
  pilotSlots: number;
  stats: PilotStats;
}) {
  const [userPilot, reviews] = await Promise.all([
    getUserPilot(innovationId),
    getPublicPilotReviews(innovationId, 3),
  ]);

  const canReview = userPilot && (userPilot.status === "in_progress" || userPilot.status === "completed");

  return (
    <aside
      aria-label="Tester innowacji"
      className="flex w-full min-w-0 flex-[1_1_320px] flex-col gap-6 lg:max-w-[380px]"
    >
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 kontrast:border-2 simple:p-8">
        <h2 className="text-h3 simple:text-simple-h3">Tester innowacji</h2>

        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-bold">
            <Star aria-hidden className="size-5 text-warning" strokeWidth={2} />
            {stats.avgRating?.toFixed(1) ?? "—"}/5
          </span>
          <span className="text-sm text-muted-foreground simple:text-simple-sm">
            {stats.reviewCount} {stats.reviewCount === 1 ? "opinia" : "opinii"}
          </span>
        </div>

        {userPilot && (
          <Alert tone="info" title="Twoje zgłoszenie">
            Status: {PILOT_STATUS_LABELS[userPilot.status]}
          </Alert>
        )}

        {canReview ? (
          <Button asChild size="lg" className="w-full">
            <Link href={`/library/${innovationSlug}/pilot`}>
              <PenLine aria-hidden className="size-6" strokeWidth={2} />
              Zaproponuj usprawnienie
            </Link>
          </Button>
        ) : pilotSlots > 0 ? (
          <Button asChild size="lg" className="w-full">
            <Link href={`/library/${innovationSlug}/pilot`}>
              <TestTubeDiagonal aria-hidden className="size-6" strokeWidth={2} />
              Chcę testować
            </Link>
          </Button>
        ) : (
          <Alert tone="info" title="Brak wolnych miejsc" className="text-sm simple:text-simple-sm">
            W tej chwili nie ma wolnych miejsc na pilotaż.
          </Alert>
        )}
      </div>

      {reviews.length > 0 && (
        <section aria-labelledby="aside-reviews-heading" className="flex flex-col gap-4">
          <h3 id="aside-reviews-heading" className="text-h4 simple:text-simple-h4">
            Co mówią testerzy
          </h3>
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 kontrast:border-2 simple:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-muted-foreground simple:text-simple-sm">
                    {review.attribution}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold simple:text-simple-sm">
                    <Star aria-hidden className="size-4 text-warning" strokeWidth={2} />
                    {review.rating}/5
                  </span>
                </div>
                {review.feedback && (
                  <p className="text-sm simple:text-simple-sm">
                    <MessageSquareQuote aria-hidden className="mr-1 inline size-4" strokeWidth={2} />
                    {review.feedback}
                  </p>
                )}
                {review.improvement && (
                  <p className="text-sm text-muted-foreground simple:text-simple-sm">
                    <span className="font-bold">Usprawnienie:</span> {review.improvement}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Button asChild variant="link" size="sm" className="self-start">
            <Link href={`/library/${innovationSlug}/pilot`}>Zobacz więcej</Link>
          </Button>
        </section>
      )}
    </aside>
  );
}
