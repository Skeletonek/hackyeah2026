import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { challengeMap } from "@/lib/challenges/challenge-map";
import { countyIndicators } from "@/lib/challenges/county-indicators";
import { CHALLENGE_CATEGORY_LABELS } from "@/lib/labels";
import {
  countyShapes,
  hasCountyData,
  loadSubmissionCounts,
  parseChallenge,
  parseCounty,
} from "@/lib/library/challenges";
import { ChallengePicker, ViewTabs } from "./_components/controls";
import { CountyMap } from "./_components/county-map";
import { CountyPanel } from "./_components/county-panel";
import { CountyTable } from "./_components/county-table";
import { MapLegend, PatternDefs } from "./_components/map-legend";
import { challengesHref, type View } from "./_components/shared";

const TITLE = "Mapa wyzwań społecznych";

export const metadata: Metadata = { title: TITLE };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const view: View = first(params.view) === "list" ? "list" : "map";
  const category = parseChallenge(first(params.challenge));
  const county = parseCounty(first(params.county));
  const hasData = hasCountyData(category);
  const counts = await loadSubmissionCounts();

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-10 sm:px-8">
      <PatternDefs />
      <div className="flex max-w-[68ch] flex-col gap-3">
        <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Zobacz, z czym najbardziej mierzą się powiaty Małopolski. Wybierz wyzwanie i powiat.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <ChallengePicker view={view} category={category} county={county?.code} />
        <ViewTabs view={view} category={category} county={county?.code} />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {!hasData && (
            <Alert tone="info" title={`Brak danych powiatowych: ${CHALLENGE_CATEGORY_LABELS[category].toLowerCase()}`}>
              ROPS nie ma jeszcze tych danych dla powiatów. Wybierz inne wyzwanie albo powiat, żeby zobaczyć jego
              najważniejsze wyzwania.
            </Alert>
          )}
          {view === "map" ? (
            <figure className="flex flex-col gap-5">
              <div className="rounded-lg border-2 border-border bg-card p-3 sm:p-5">
                <CountyMap category={category} hasData={hasData} selected={county?.code} />
              </div>
              <figcaption className="flex flex-col gap-3">
                {hasData && <MapLegend category={category} />}
                <p className="text-muted-foreground">
                  Te same dane są w{" "}
                  <a
                    href={challengesHref({ view: "list", challenge: category, county: county?.code })}
                    className="text-primary underline underline-offset-[0.2em] hover:decoration-[3px]"
                  >
                    widoku listy
                  </a>
                  .
                </p>
              </figcaption>
            </figure>
          ) : (
            <CountyTable category={category} counts={counts} selected={county?.code} />
          )}
        </div>
        <CountyPanel county={county} counts={counts} />
      </div>

      <section aria-labelledby="sources-heading" className="flex max-w-[68ch] flex-col gap-3">
        <h2 id="sources-heading" className="text-h3 simple:text-simple-h3">
          Skąd są dane
        </h2>
        <p>{countyIndicators.method}</p>
        <p className="text-muted-foreground">{countyIndicators.source.note}</p>
        <ul className="flex flex-col gap-1">
          <SourceLink href={countyIndicators.source.url}>{countyIndicators.source.title}</SourceLink>
          <SourceLink href={challengeMap.source.url}>
            {challengeMap.source.title} (ROPS Kraków), dane ogólnopolskie
          </SourceLink>
          <SourceLink href={countyShapes.source.url}>{countyShapes.source.title}</SourceLink>
        </ul>
      </section>
    </main>
  );
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a
        href={href}
        className="inline-flex min-h-11 items-center gap-1 text-primary underline underline-offset-[0.2em] hover:decoration-[3px]"
      >
        {children}
        <ExternalLink aria-hidden className="size-5 shrink-0" strokeWidth={2} />
      </a>
    </li>
  );
}
