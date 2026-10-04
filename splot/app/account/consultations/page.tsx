import type { Metadata } from "next";
import { CalendarDays, Clock } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { DemoPreviewAction } from "@/components/demo-preview-action";
import { requireUser } from "@/lib/auth";
import { EXPERT_SLOTS } from "@/lib/demo/partners";

const TITLE = "Konsultacje";

export const metadata: Metadata = { title: TITLE };

/** KOM5: expert consultation booking preview. All booking actions are demo-only. */
export default async function ConsultationsPage() {
  await requireUser("/account/consultations");

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
          <p className="text-lead text-muted-foreground simple:text-simple-lead">
            Umów bezpłatne spotkanie z ekspertem ROPS i omów swój pomysł lub wyzwanie.
          </p>
        </div>

        <Alert tone="warning" title="Podgląd" className="w-full">
          Ta funkcja pojawi się w kolejnej wersji. Poniżej znajdują się przykładowi eksperci i terminy —
          na razie nie można umówić spotkania.
        </Alert>
      </div>

      <section aria-label="Dostępni eksperci" className="w-full max-w-[760px]">
        <h2 className="sr-only">Lista ekspertów</h2>
        <ul className="flex flex-col gap-4">
          {EXPERT_SLOTS.map((expert) => (
            <li
              key={expert.id}
              className="flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-h4 font-bold simple:text-simple-h4">{expert.name}</h3>
                <p className="text-sm text-muted-foreground">{expert.role}</p>
              </div>

              <p className="text-foreground">{expert.description}</p>

              <div className="flex flex-wrap gap-2">
                {expert.specialization.map((area) => (
                  <span
                    key={area}
                    className="inline-flex min-h-11 items-center rounded-full border-2 border-secondary bg-secondary px-4 text-sm font-bold text-secondary-foreground simple:min-h-16 simple:text-simple-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>

              <div className="rounded-md border-2 border-dashed border-border bg-muted p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                  <span className="font-bold">Najbliższe terminy</span>
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {expert.nextSlots.map((slot) => (
                    <li
                      key={slot}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-input bg-card px-4 text-sm font-bold simple:min-h-16 simple:text-simple-sm"
                    >
                      <Clock aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                      {slot}
                    </li>
                  ))}
                </ul>
              </div>

              <DemoPreviewAction label="Umów spotkanie" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
