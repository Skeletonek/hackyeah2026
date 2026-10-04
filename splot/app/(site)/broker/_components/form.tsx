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
import { ServiceCardView } from "./service-card";

export type BrokerInnovationOption = { slug: string; title: string };

/** At most 5 context fields plus the innovation choice. `useObject` reads the result. */
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
  const done = !isLoading && !error && !streamFailed && Boolean(card?.title);
  const innovationTitle =
    innovations.find((item) => item.slug === slug)?.title ?? slug;

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 print:hidden" noValidate>
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
          {/* Both stay mounted so keyboard focus is not dropped when loading starts. */}
          <Button type="submit" disabled={isLoading}>
            Ułóż plan usługi
          </Button>
          <Button type="button" variant="secondary" onClick={() => stop()} disabled={!isLoading}>
            Zatrzymaj
          </Button>
        </div>
      </form>

      <section aria-label="Plan usługi" aria-busy={isLoading} className="flex flex-col gap-4">
        {/* Always mounted, so screen readers announce its changes; the streamed card itself is not live. */}
        <p role="status" className={done ? "sr-only" : undefined}>
          {isLoading && !card?.title ? "Układam plan na podstawie opisu innowacji…" : null}
          {done ? "Plan usługi jest gotowy." : null}
        </p>

        {error || streamFailed ? (
          <p role="alert" className="text-sm font-bold text-destructive">
            Usługa jest chwilowo niedostępna. Spróbuj ponownie.
          </p>
        ) : null}

        {card?.title ? (
          <ServiceCardView
            card={card}
            slug={slug}
            innovationTitle={innovationTitle}
            complete={done}
          />
        ) : null}
      </section>
    </div>
  );
}
