"use client";

import Link from "next/link";
import { MapPin, Search, Printer } from "lucide-react";
import { AiHint } from "@/components/ai/ai-hint";
import { Button } from "@/components/ui/button";
import type { ServiceCard } from "@/lib/broker/schema";
import styles from "./service-card.module.css";

type PartialCard = Partial<ServiceCard>;

/**
 * MID2: the broker's result as a service card the official can print and act
 * on. Shown while streaming; section by section as the fields arrive.
 */
export function ServiceCardView({
  card,
  slug,
  innovationTitle,
  complete,
}: {
  card: PartialCard;
  /** The innovation this plan adapts, for the follow-up links. */
  slug: string;
  innovationTitle: string;
  /** The stream finished with a valid card; shows the AiHint reactions. */
  complete: boolean;
}) {
  return (
    <div className={styles.printArea}>
      <AiHint
        targetType="broker_card"
        targetId={`broker:${slug}`}
        feedback={complete}
        className={styles.card}
      >
        <article aria-label="Plan usługi" className="flex flex-col gap-4">
          <h2 className="text-h3 simple:text-simple-h3">{card.title}</h2>
          {card.description ? <p className="max-w-[68ch]">{card.description}</p> : null}

          {card.steps?.length ? (
            <section aria-label="Kroki wdrożenia">
              <h3 className="text-h4 simple:text-simple-h4">Kroki wdrożenia</h3>
              <ol className="mt-2 flex list-decimal flex-col gap-2 pl-6">
                {card.steps.map((step, index) => (
                  <li key={`${step?.title}-${index}`}>
                    <strong>{step?.title}</strong>
                    {step?.when ? ` — ${step.when}` : null}
                    {step?.detail ? <p>{step.detail}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {card.resources?.length ? (
            <section aria-label="Potrzebne zasoby">
              <h3 className="text-h4 simple:text-simple-h4">Potrzebne zasoby</h3>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-6">
                {card.resources.map((resource, index) => (
                  <li key={`${resource}-${index}`}>{resource}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {card.costEstimate?.range ? (
            <section aria-label="Szacunkowy koszt">
              <h3 className="text-h4 simple:text-simple-h4">Szacunkowy koszt</h3>
              <p className="mt-2">
                {card.costEstimate.range}
                {card.costEstimate.note ? ` — ${card.costEstimate.note}` : null}
              </p>
            </section>
          ) : null}

          {card.risks?.length ? (
            <section aria-label="Ryzyka">
              <h3 className="text-h4 simple:text-simple-h4">Ryzyka</h3>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-6">
                {card.risks.map((item, index) => (
                  <li key={`${item?.risk}-${index}`}>
                    {item?.risk}
                    {item?.mitigation ? ` Sposób: ${item.mitigation}` : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {card.indicators?.length ? (
            <section aria-label="Wskaźniki sukcesu">
              <h3 className="text-h4 simple:text-simple-h4">Wskaźniki sukcesu</h3>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-6">
                {card.indicators.map((indicator, index) => (
                  <li key={`${indicator}-${index}`}>{indicator}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </AiHint>

      {complete && (
        <div className={`flex flex-wrap gap-3 ${styles.noPrint}`}>
          <Button type="button" onClick={() => window.print()} className="simple:w-full">
            <Printer aria-hidden strokeWidth={2} />
            Pobierz PDF / wydrukuj
          </Button>
          <Button type="button" variant="outline" asChild className="max-w-full whitespace-normal simple:w-full">
            <Link href={`/library/${encodeURIComponent(slug)}#gdzie-dziala`}>
              <MapPin aria-hidden strokeWidth={2} />
              Zobacz gminy, które już to wdrożyły
            </Link>
          </Button>
          <Button type="button" variant="outline" asChild className="simple:hidden">
            <Link href={`/match?q=${encodeURIComponent(innovationTitle)}`}>
              <Search aria-hidden strokeWidth={2} />
              Szukaj podobnych rozwiązań
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
