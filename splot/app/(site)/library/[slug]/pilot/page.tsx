import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ORGANIZATION_TYPE_LABELS, PILOT_STATUS_LABELS } from "@/lib/labels";
import { getPublicPilotReviews, getUserPilot, getUserPilotReview } from "@/lib/library/pilots";
import { getPublishedInnovation } from "@/lib/library/innovation";
import { ApplicationForm } from "./_components/application-form";
import { ReviewForm } from "./_components/review-form";

const TITLE = "Testuj innowację";

export async function generateMetadata({ params }: PageProps<"/library/[slug]/pilot">): Promise<Metadata> {
  const { slug } = await params;
  const innovation = await getPublishedInnovation(slug);
  if (!innovation) return { title: TITLE };
  return { title: `${TITLE} — ${innovation.title}` };
}

export default async function PilotPage({ params }: PageProps<"/library/[slug]/pilot">) {
  const { slug } = await params;
  const innovation = await getPublishedInnovation(slug);
  if (!innovation) notFound();

  const userPilot = await getUserPilot(innovation.id);
  const canReview = userPilot && (userPilot.status === "in_progress" || userPilot.status === "completed");

  const [reviews, existingReview] = await Promise.all([
    getPublicPilotReviews(innovation.id, 3),
    canReview ? getUserPilotReview(userPilot.id) : Promise.resolve(null),
  ]);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 py-10 sm:px-8"
    >
      <div className="flex flex-col gap-2">
        <Button asChild variant="link" size="sm" className="self-start">
          <Link href={`/library/${slug}`}>← Wróć do innowacji</Link>
        </Button>
        <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">{innovation.title}</p>
      </div>

      {canReview ? (
        <ReviewForm
          pilotId={userPilot.id}
          defaultAttribution={
            userPilot.organizationType
              ? `${ORGANIZATION_TYPE_LABELS[userPilot.organizationType]} ${userPilot.municipality}`
              : userPilot.municipality
          }
          existingReview={existingReview}
        />
      ) : userPilot ? (
        <Alert
          tone="info"
          title="Twoje zgłoszenie jest w trakcie obsługi"
          action={
            <Button asChild variant="outline">
              <Link href={`/library/${slug}`}>Wróć do innowacji</Link>
            </Button>
          }
        >
          Status: {PILOT_STATUS_LABELS[userPilot.status]}. Gdy ROPS zaakceptuje pilotaż, będziesz mógł
          dodać opinię.
        </Alert>
      ) : innovation.pilot_slots > 0 ? (
        <ApplicationForm innovationId={innovation.id} />
      ) : (
        <Alert tone="info" title="Brak wolnych miejsc na pilotaż">
          W tej chwili nie ma wolnych miejsc do testowania tej innowacji. Spróbuj ponownie później.
        </Alert>
      )}

      {reviews.length > 0 && (
        <section aria-labelledby="reviews-heading" className="flex flex-col gap-4">
          <h2 id="reviews-heading" className="text-h2 simple:text-simple-h2">
            Co mówią testerzy
          </h2>
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-lg border border-border bg-card p-5 kontrast:border-2 simple:p-6"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{review.attribution}</span>
                  <span className="text-sm font-bold text-muted-foreground simple:text-simple-sm">
                    {review.rating}/5
                  </span>
                </div>
                {review.feedback && <p className="mb-2">{review.feedback}</p>}
                {review.improvement && (
                  <p className="text-sm text-muted-foreground simple:text-simple-sm">
                    <span className="font-bold">Usprawnienie:</span> {review.improvement}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
