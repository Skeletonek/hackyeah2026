import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DemoPreviewAction } from "@/components/demo-preview-action";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { PARTNER_MATCHES, partnerTypeLabel } from "@/lib/demo/partners";

const TITLE = "Szukam partnera";

export const metadata: Metadata = { title: TITLE };

/** KOM4: AI partner matches preview. All actions are demo-only. */
export default async function PartnersPage() {
  await requireUser("/account/partners");

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
          <p className="text-lead text-muted-foreground simple:text-simple-lead">
            Propozycje partnerów dopasowane przez AI do Twojego profilu i aktywności w Hubie.
          </p>
        </div>

        <Alert tone="warning" title="Podgląd" className="w-full">
          Ta funkcja pojawi się w kolejnej wersji. Poniżej znajdują się przykładowe dopasowania — na razie
          nie można z nich skorzystać.
        </Alert>
      </div>

      {/* Demo toolbar: visually present, but disabled. */}
      <div className="flex w-full max-w-[760px] flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            aria-label="Szukaj partnera"
            placeholder="Słowo kluczowe, gmina lub obszar"
            defaultValue=""
            disabled
            className="pl-12"
          />
        </div>
        <div className="flex min-w-[12rem] items-center gap-2">
          <Select aria-label="Filtruj według obszaru" disabled defaultValue="">
            <option value="">Wszystkie obszary</option>
            <option value="aging">Starzenie się</option>
            <option value="digital">Wykluczenie cyfrowe</option>
            <option value="loneliness">Samotność</option>
          </Select>
        </div>
        <Button variant="outline" disabled className="shrink-0">
          <SlidersHorizontal aria-hidden className="size-5" strokeWidth={2} />
          Więcej filtrów
        </Button>
      </div>

      <section aria-label="Propozycje partnerów" className="w-full max-w-[760px]">
        <h2 className="sr-only">Lista propozycji</h2>
        <ul className="flex flex-col gap-4">
          {PARTNER_MATCHES.map((partner) => (
            <li
              key={partner.id}
              className="flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5"
            >
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-h4 font-bold break-words simple:text-simple-h4">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {partnerTypeLabel(partner.type)} · {partner.county}
                    </p>
                  </div>
                  <span
                    aria-label={`Dopasowanie ${partner.match} procent`}
                    className="grid h-12 min-w-[4.5rem] place-items-center rounded-md border-2 border-primary bg-secondary px-3 text-h4 font-bold text-primary simple:min-h-16"
                  >
                    {partner.match}%
                  </span>
                </div>
              </div>

              <p className="text-foreground">{partner.description}</p>

              <div className="flex flex-wrap gap-2">
                {partner.areas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex min-h-11 items-center rounded-full border-2 border-secondary bg-secondary px-4 text-sm font-bold text-secondary-foreground simple:min-h-16 simple:text-simple-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>

              <div className="rounded-md bg-accent p-4">
                <p className="text-accent-foreground">
                  <span className="font-bold">Dlaczego to pasuje: </span>
                  {partner.matchReason}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <DemoPreviewAction label="Nawiąż kontakt" />
                <DemoPreviewAction label="Zobacz profil" variant="outline" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
