import Link from "next/link";
import { ArrowRight, CircleCheck, FlaskConical, MapPin } from "lucide-react";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/labels";
import type { PilotPlace } from "@/lib/library/innovation";

const STATUS = {
  completed: { icon: CircleCheck, label: "test zakończony", className: "text-success" },
  in_progress: { icon: FlaskConical, label: "testuje teraz", className: "text-info" },
} as const;

/** „Gdzie już działa”: places from `public_pilot_places`, status as icon + word. */
export function PilotPlaces({ places, innovationSlug }: { places: PilotPlace[]; innovationSlug: string }) {
  return (
    <section aria-labelledby="places-heading" id="gdzie-dziala" className="flex scroll-mt-24 flex-col gap-4">
      <h2 id="places-heading" className="text-h2 simple:text-simple-h2">
        Gdzie już działa
      </h2>

      {places.length > 0 ? (
        <ul className="flex flex-col rounded-lg border border-border bg-card kontrast:border-2">
          {places.map((place, index) => {
            const status = STATUS[place.status];
            return (
              <li
                key={index}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <span className="inline-flex items-center gap-2.5 font-bold">
                  <MapPin aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                  {place.municipality}
                </span>
                <span className="inline-flex flex-wrap items-center gap-x-2 text-muted-foreground">
                  {ORGANIZATION_TYPE_LABELS[place.organizationType]} ·
                  <span className={`inline-flex items-center gap-1.5 font-bold ${status.className}`}>
                    <status.icon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                    {status.label}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="max-w-[68ch] text-muted-foreground">
          Przez Splot nikt jeszcze tego nie testował. Twoja gmina lub organizacja może być pierwsza.
        </p>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1 simple:hidden">
        <Link
          href="/challenges"
          className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline underline-offset-[0.2em] hover:decoration-[3px]"
        >
          <MapPin aria-hidden className="size-5 shrink-0" strokeWidth={2} />
          Zobacz Mapę Wyzwań
        </Link>
        <Link
          href={`/broker?innovation=${encodeURIComponent(innovationSlug)}`}
          className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline underline-offset-[0.2em] hover:decoration-[3px]"
        >
          Przygotuj taką usługę dla swojej instytucji
          <ArrowRight aria-hidden className="size-5 shrink-0" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
