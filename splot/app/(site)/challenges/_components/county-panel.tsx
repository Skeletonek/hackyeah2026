import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { Button } from "@/components/ui/button";
import type { County } from "@/lib/challenges/county-indicators";
import { CHALLENGE_CATEGORY_LABELS } from "@/lib/labels";
import {
  OTHER_COUNTIES,
  indicatorsFor,
  scoreLevel,
  worseThanCount,
  type SubmissionCounts,
} from "@/lib/library/challenges";
import { capitalize, formatNumber, pluralSubmissions } from "./shared";
import { FocusOnChange } from "./focus-on-change";

const HEADING_ID = "county-heading";

/** „Główny Urząd Statystyczny (Bank Danych Lokalnych). Do 2021…” → its first sentence. */
function shortSource(source: string) {
  return source.split(". ")[0];
}

function libraryHref(category: string) {
  return `/library?category=${category}`;
}

/** Side panel for the picked county: top challenges with indicators, submissions and a way into the library. */
export function CountyPanel({ county, counts }: { county?: County; counts: SubmissionCounts }) {
  if (!county) {
    return (
      <section
        id="powiat"
        aria-labelledby={HEADING_ID}
        className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-border p-5"
      >
        <h2 id={HEADING_ID} className="text-h3 simple:text-simple-h3">
          Szczegóły powiatu
        </h2>
        <p className="text-muted-foreground">
          Wybierz powiat na mapie albo w widoku listy. Pokażemy jego 3 najważniejsze wyzwania, dane i liczbę
          zgłoszeń.
        </p>
      </section>
    );
  }

  const submissions = counts.get(county.code);
  const [topChallenge] = county.top_challenges;

  return (
    <section
      id="powiat"
      aria-labelledby={HEADING_ID}
      className="flex flex-col gap-6 rounded-lg border-2 border-border bg-card p-5 shadow-sm kontrast:shadow-none"
    >
      <FocusOnChange targetId={HEADING_ID} value={county.code} />
      <div className="flex flex-col gap-1">
        <h2 id={HEADING_ID} tabIndex={-1} className="text-h3 simple:text-simple-h3">
          {capitalize(county.name)}
        </h2>
        <p className="text-muted-foreground">{formatNumber(county.population)} mieszkańców</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-h4 simple:text-simple-h4">Najważniejsze wyzwania</h3>
        <ol className="flex flex-col gap-5">
          {county.top_challenges.map((category, index) => {
            const score = county.category_scores[category] ?? 0;
            return (
              <li key={category} className="flex flex-col gap-2 border-t-2 border-border pt-4 first:border-t-0 first:pt-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{index + 1}.</span>
                  <CategoryBadge category={category} />
                </p>
                <p>
                  Trudniej niż w {worseThanCount(score)} z {OTHER_COUNTIES} powiatów, poziom „{scoreLevel(score).label}”.
                </p>
                <dl className="flex flex-col gap-2">
                  {indicatorsFor(category).map((indicator) => {
                    const value = county.values[indicator.key];
                    if (value === undefined) return null;
                    return (
                      <div key={indicator.key} className="flex flex-col">
                        <dt className="text-sm text-muted-foreground simple:text-simple-sm">{indicator.label}</dt>
                        <dd className="flex flex-col">
                          <span>
                            <span className="font-bold">{formatNumber(value)}</span> {indicator.unit} ({indicator.year})
                          </span>
                          <a
                            href={indicator.source_url}
                            className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-primary underline underline-offset-[0.2em] hover:decoration-[3px] simple:hidden"
                          >
                            Źródło: {shortSource(indicator.source)}
                            <ExternalLink aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                          </a>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                {index > 0 && (
                  <Link
                    href={libraryHref(category)}
                    className="inline-flex min-h-11 items-center self-start text-primary underline underline-offset-[0.2em] hover:decoration-[3px] simple:min-h-16"
                  >
                    Rozwiązania: {CHALLENGE_CATEGORY_LABELS[category].toLowerCase()}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-h4 simple:text-simple-h4">Zgłoszenia z tego powiatu</h3>
        {submissions ? (
          <>
            <p>
              <span className="font-bold">{submissions.total}</span>{" "}
              {pluralSubmissions(submissions.total)} w Splocie.
            </p>
            <ul className="flex flex-col gap-1">
              {[...submissions.byCategory].map(([category, count]) => (
                <li key={category}>
                  {CHALLENGE_CATEGORY_LABELS[category]}: <span className="font-bold">{count}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-muted-foreground">Nie ma jeszcze zgłoszeń z tego powiatu.</p>
        )}
      </div>

      <Button asChild>
        <Link href={libraryHref(topChallenge)}>
          Zobacz rozwiązania: {CHALLENGE_CATEGORY_LABELS[topChallenge].toLowerCase()}
          <ArrowRight aria-hidden strokeWidth={2} />
        </Link>
      </Button>
    </section>
  );
}
