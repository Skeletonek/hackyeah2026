import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { AiThinking } from "@/components/ai/ai-thinking";
import { CategoryBadge } from "@/components/category-badge";
import { EmptyState } from "@/components/empty-state";
import { categoryLabel, getTrends, TREND_WEEKS } from "@/lib/admin/trends";
import { BarList, percent } from "./_components/bar-list";
import { HeatTable } from "./_components/heat-table";
import { WeeklySummary } from "./_components/weekly-summary";

export const metadata: Metadata = { title: "Trendy" };

const sectionClassName = "flex flex-col gap-4 rounded-lg border-2 border-border bg-card p-5 sm:p-6";
const tileClassName = "flex flex-col gap-1 rounded-lg border-2 border-border bg-card px-5 py-4";

const WEEK_START = new Intl.DateTimeFormat("pl-PL", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** ADM3: what the region writes about, visible only to ROPS. No map here; it lives in /challenges. */
export default async function AdminTrendsPage() {
  const trends = await getTrends();
  const thisWeek = trends.weekTotals.at(-1)!;
  const lastWeek = trends.weekTotals.at(-2)!;
  const top = trends.byCategory[0];
  const topCounty = trends.topCounties[0];
  const counted = trends.total - trends.withoutCounty;

  return (
    <main id="main-content" className="flex flex-col gap-8 p-4 sm:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">Trendy zgłoszeń</h1>
        <p className="max-w-[68ch] text-muted-foreground">
          Z czym mieszkańcy, gminy i organizacje z Małopolski zgłaszają się do Splotu. Ostatnie{" "}
          {TREND_WEEKS} tygodni, od {trends.weeks[0].label}. Widzi to tylko zespół ROPS.
        </p>
      </header>

      {trends.total === 0 ? (
        <EmptyState title="Brak zgłoszeń w tych tygodniach">
          Trendy pojawią się, gdy mieszkańcy, gminy albo organizacje opiszą pierwsze problemy.
        </EmptyState>
      ) : (
        <>
          <section aria-labelledby="numbers-heading" className="flex flex-col gap-3">
            <h2 id="numbers-heading" className="sr-only">
              Najważniejsze liczby
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className={tileClassName}>
                <dt className="text-muted-foreground">Zgłoszenia w tym tygodniu</dt>
                <dd className="font-display text-h1 font-bold">{thisWeek}</dd>
                <dd className="text-sm">
                  Od {WEEK_START.format(new Date(`${trends.weeks.at(-1)!.start}T00:00:00Z`))}.
                  Poprzedni tydzień: {lastWeek}.
                </dd>
              </div>
              <div className={tileClassName}>
                <dt className="text-muted-foreground">Zgłoszenia przez {TREND_WEEKS} tygodni</dt>
                <dd className="font-display text-h1 font-bold">{trends.total}</dd>
                <dd className="text-sm">
                  Średnio{" "}
                  {(trends.total / TREND_WEEKS).toLocaleString("pl-PL", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  tygodniowo.
                </dd>
              </div>
              <div className={tileClassName}>
                <dt className="text-muted-foreground">Najczęstsza kategoria</dt>
                <dd className="mt-2">
                  {top.category ? (
                    <CategoryBadge category={top.category} />
                  ) : (
                    <span className="font-bold">{categoryLabel(null)}</span>
                  )}
                </dd>
                <dd className="text-sm">
                  {top.count} z {trends.total} zgłoszeń.
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="summary-heading" className="flex flex-col gap-4">
            <h2 id="summary-heading" className="text-h3">
              Podsumowanie tygodnia
            </h2>
            <Suspense fallback={<AiThinking label="Piszę podsumowanie tygodnia…" />}>
              <WeeklySummary trends={trends} />
            </Suspense>
          </section>

          <section aria-labelledby="heat-heading" className={sectionClassName}>
            <h2 id="heat-heading" className="text-h3">
              Potrzeby według kategorii i tygodni
            </h2>
            <p id="heat-description" className="max-w-[68ch]">
              <strong>W skrócie:</strong> najwięcej zgłoszeń dotyczy kategorii{" "}
              „{categoryLabel(top.category)}” ({top.count} z {trends.total}). Tydzień zaczyna się w
              poniedziałek, ostatni jeszcze trwa.
            </p>
            <HeatTable trends={trends} describedBy="heat-description" />
          </section>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <section aria-labelledby="categories-heading" className={sectionClassName}>
              <h2 id="categories-heading" className="text-h3">
                Zgłoszenia według kategorii
              </h2>
              <BarList
                total={trends.total}
                bars={trends.byCategory.map((item) => ({
                  key: item.category ?? "none",
                  label: categoryLabel(item.category),
                  count: item.count,
                }))}
              />
            </section>

            <section aria-labelledby="counties-heading" className={sectionClassName}>
              <h2 id="counties-heading" className="text-h3">
                Powiaty z największą liczbą zgłoszeń
              </h2>
              {topCounty ? (
                <>
                  <p className="max-w-[68ch]">
                    <strong>W skrócie:</strong> {percent(topCounty.count, trends.total)} zgłoszeń (
                    {topCounty.count} z {trends.total}) jest z: {topCounty.name}.
                  </p>
                  <BarList
                    ordered
                    total={trends.total}
                    bars={trends.topCounties.map((county) => ({
                      key: county.code,
                      label: county.name,
                      count: county.count,
                    }))}
                  />
                </>
              ) : (
                <p className="text-muted-foreground">Żadne zgłoszenie nie ma jeszcze powiatu.</p>
              )}
              {trends.withoutCounty > 0 && counted > 0 && (
                <p className="text-sm text-muted-foreground">
                  Bez podanego powiatu: {trends.withoutCounty}.
                </p>
              )}
              <Link
                href="/challenges"
                className="inline-flex min-h-11 w-fit items-center gap-2 font-bold text-primary underline underline-offset-4"
              >
                <MapPin aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                Zobacz na Mapie Wyzwań
              </Link>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
