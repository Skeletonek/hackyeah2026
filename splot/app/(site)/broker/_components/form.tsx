"use client";

import { useState } from "react";
import { useObject } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  BUDGET_OPTIONS,
  MUNICIPALITY_TYPE_OPTIONS,
  POPULATION_OPTIONS,
  serviceCardSchema,
  type ServiceCard,
} from "@/lib/broker/schema";

export type BrokerInnovationOption = { slug: string; title: string };

/** ≤5 pól kontekstu + wybór innowacji. Wynik czyta `useObject`. */
export function BrokerForm({
  innovations,
  initialSlug,
}: {
  innovations: BrokerInnovationOption[];
  initialSlug: string;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [municipalityType, setMunicipalityType] = useState("wiejska");
  const [population, setPopulation] = useState("5-20-tys");
  const [budget, setBudget] = useState("10-50-tys");
  const [staff, setStaff] = useState("");
  const [partners, setPartners] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [streamFailed, setStreamFailed] = useState(false);

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/broker",
    schema: serviceCardSchema,
    // A stream that ends without a valid card failed, even if the socket closed cleanly.
    onFinish({ object: finished }) {
      setStreamFailed(!finished?.title);
    },
  });

  const card = object as Partial<ServiceCard> | undefined;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextSlugError = slug ? null : "Wybierz innowację z listy.";
    const nextStaffError =
      staff.trim().length < 2 ? "Opisz kadrę, np. 3 osoby z OPS." : null;
    setSlugError(nextSlugError);
    setStaffError(nextStaffError);
    if (nextSlugError || nextStaffError) return;

    setStreamFailed(false);
    submit({
      slug,
      context: {
        municipalityType,
        population,
        budget,
        staff: staff.trim(),
        partners: partners.trim(),
      },
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field
          label="Innowacja"
          hint="Wybierz rozwiązanie, które chcesz przenieść do gminy."
          error={slugError}
        >
          <Select value={slug} onChange={(event) => setSlug(event.target.value)} required>
            <option value="">Wybierz…</option>
            {innovations.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Rodzaj gminy" hint="Wybierz typ swojej gminy.">
          <Select
            value={municipalityType}
            onChange={(event) => setMunicipalityType(event.target.value)}
          >
            {MUNICIPALITY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Liczba mieszkańców" hint="Wybierz przedział zbliżony do Twojej gminy.">
          <Select value={population} onChange={(event) => setPopulation(event.target.value)}>
            {POPULATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Budżet na start" hint="Wybierz kwotę, którą gmina może wydać.">
          <Select value={budget} onChange={(event) => setBudget(event.target.value)}>
            {BUDGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Kadra" hint="Kto będzie działać, np. 3 osoby z OPS." error={staffError}>
          <Input
            value={staff}
            onChange={(event) => setStaff(event.target.value)}
            placeholder="Np. 2 osoby z OPS i bibliotekarka"
            autoComplete="off"
            required
            minLength={2}
            maxLength={200}
          />
        </Field>

        <Field
          label="Partnerzy"
          hint="Kto pomoże, np. szkoła, NGO. Pole nieobowiązkowe."
          optional
        >
          <Input
            value={partners}
            onChange={(event) => setPartners(event.target.value)}
            placeholder="Np. szkoła, parafialny zespół Caritas"
            autoComplete="off"
            maxLength={300}
          />
        </Field>

        <div className="flex flex-wrap gap-3">
          {isLoading ? (
            <Button type="button" variant="secondary" onClick={() => stop()}>
              Zatrzymaj
            </Button>
          ) : (
            <Button type="submit">Ułóż plan usługi</Button>
          )}
        </div>
      </form>

      <section aria-label="Plan usługi" aria-live="polite" className="flex flex-col gap-4">
        {isLoading && !card?.title ? (
          <p role="status">Układam plan na podstawie opisu innowacji…</p>
        ) : null}

        {error || streamFailed ? (
          <p role="alert" className="text-sm font-bold text-destructive">
            Usługa jest chwilowo niedostępna. Spróbuj ponownie.
          </p>
        ) : null}

        {card?.title ? (
          <article className="flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5">
            <p className="text-sm font-bold text-muted-foreground">
              Podpowiedź AI
              <span className="font-normal"> — sprawdź plan przed działaniem.</span>
            </p>
            <h2 className="text-h3">{card.title}</h2>
            {card.description ? <p className="max-w-[68ch]">{card.description}</p> : null}

            {card.steps?.length ? (
              <div>
                <h3 className="text-h4">Kroki wdrożenia</h3>
                <ol className="mt-2 flex list-decimal flex-col gap-2 pl-6">
                  {card.steps.map((step, index) => (
                    <li key={`${step?.title}-${index}`}>
                      <strong>{step?.title}</strong>
                      {step?.when ? ` — ${step.when}` : null}
                      {step?.detail ? <p>{step.detail}</p> : null}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {card.resources?.length ? (
              <div>
                <h3 className="text-h4">Potrzebne zasoby</h3>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-6">
                  {card.resources.map((resource, index) => (
                    <li key={`${resource}-${index}`}>{resource}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {card.costEstimate?.range ? (
              <div>
                <h3 className="text-h4">Szacunkowy koszt</h3>
                <p className="mt-2">
                  {card.costEstimate.range}
                  {card.costEstimate.note ? ` — ${card.costEstimate.note}` : null}
                </p>
              </div>
            ) : null}

            {card.risks?.length ? (
              <div>
                <h3 className="text-h4">Ryzyka</h3>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-6">
                  {card.risks.map((item, index) => (
                    <li key={`${item?.risk}-${index}`}>
                      {item?.risk}
                      {item?.mitigation ? ` Sposób: ${item.mitigation}` : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {card.indicators?.length ? (
              <div>
                <h3 className="text-h4">Wskaźniki sukcesu</h3>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-6">
                  {card.indicators.map((indicator, index) => (
                    <li key={`${indicator}-${index}`}>{indicator}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ) : null}
      </section>
    </div>
  );
}
