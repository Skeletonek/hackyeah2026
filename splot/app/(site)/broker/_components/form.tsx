"use client";

import { useEffect, useState, useTransition } from "react";
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
import type { BrokerInnovationOption, BrokerInnovationResults } from "@/lib/broker/innovations";
import { findBrokerInnovations } from "../actions";
import { ServiceCardView } from "./service-card";

/** Waits for a pause in typing before the picker searches. */
const SEARCH_DELAY_MS = 300;

/** At most 5 context fields plus the innovation choice. `useObject` reads the result. */
export function BrokerForm({
  initialResults,
  initialInnovation,
}: {
  /** The first page of the picker, before any search. */
  initialResults: BrokerInnovationResults;
  /** Preselected from `?innovation=<slug>`. */
  initialInnovation: BrokerInnovationOption | null;
}) {
  const [slug, setSlug] = useState(initialInnovation?.slug ?? "");
  const [picked, setPicked] = useState(initialInnovation);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(initialResults);
  const [searching, startSearch] = useTransition();
  const [submittedInnovation, setSubmittedInnovation] = useState<BrokerInnovationOption | null>(null);
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

  // The picker lists one page of titles; typing searches the whole library on the server.
  const query = search.trim();
  useEffect(() => {
    if (!query) return;
    let current = true;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const next = await findBrokerInnovations(query);
        if (current) setSearchResults(next);
      });
    }, SEARCH_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query]);
  const results = query ? searchResults : initialResults;

  // The chosen innovation stays selectable while a search shows other titles.
  const options =
    picked && !results.items.some((item) => item.slug === picked.slug)
      ? [picked, ...results.items]
      : results.items;

  function pick(value: string) {
    setSlug(value);
    setPicked(options.find((item) => item.slug === value) ?? null);
  }

  const card = object as Partial<ServiceCard> | undefined;
  const done = !isLoading && !error && !streamFailed && Boolean(card?.title);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextSlugError = slug ? null : "Wybierz innowację z listy.";
    const nextStaffError =
      staff.trim().length < 2 ? "Opisz kadrę, np. 3 osoby z OPS." : null;
    setSlugError(nextSlugError);
    setStaffError(nextStaffError);
    if (nextSlugError || nextStaffError) return;

    // Keep the card's links and feedback tied to the request, even if the form changes.
    setSubmittedInnovation({
      slug,
      title: picked?.title ?? slug,
    });
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
        <Field label="Szukaj innowacji" hint="Wpisz część nazwy, np. „senior” albo „opieka”." optional>
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoComplete="off"
            maxLength={200}
          />
        </Field>

        <Field
          label="Innowacja"
          hint="Wybierz rozwiązanie, które chcesz przenieść do gminy."
          error={slugError}
        >
          <Select value={slug} onChange={(event) => pick(event.target.value)} aria-busy={searching} required>
            <option value="">Wybierz…</option>
            {options.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </Select>
        </Field>
        <p role="status" className="-mt-3 text-sm text-muted-foreground simple:text-simple-sm">
          {results.total === 0
            ? "Żadna innowacja nie pasuje. Spróbuj innej nazwy."
            : results.total > results.items.length
              ? `Na liście ${results.items.length} z ${results.total} innowacji. Wpisz nazwę, aby znaleźć pozostałe.`
              : `Na liście wszystkie pasujące innowacje: ${results.total}.`}
        </p>

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
          <Button type="submit" disabled={isLoading} className="simple:w-full">
            Ułóż plan usługi
          </Button>
          <Button type="button" variant="secondary" onClick={() => stop()} disabled={!isLoading} className="simple:w-full">
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
          <p role="alert" className="text-sm font-bold text-destructive simple:text-simple-sm">
            Usługa jest chwilowo niedostępna. Spróbuj ponownie.
          </p>
        ) : null}

        {card?.title && submittedInnovation ? (
          <ServiceCardView
            card={card}
            slug={submittedInnovation.slug}
            innovationTitle={submittedInnovation.title}
            complete={done}
          />
        ) : null}
      </section>
    </div>
  );
}
