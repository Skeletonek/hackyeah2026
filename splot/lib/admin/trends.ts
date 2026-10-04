import "server-only";

import { generateText, Output } from "ai";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { TEXT_MODEL } from "@/lib/ai/models";
import {
  CHALLENGE_CATEGORY_LABELS,
  countyName,
  type ChallengeCategory,
} from "@/lib/labels";
import { Constants } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/** The window every aggregate on /admin/trends covers. */
export const TREND_WEEKS = 12;
const TOP_COUNTIES = 5;
/** Rows per request; PostgREST caps a single response at 1000. */
const PAGE_SIZE = 1000;
/** A safety stop, far above what twelve weeks of submissions can reach. */
const MAX_PAGES = 50;

/** Tag of the cached AI summary; „Odśwież podsumowanie” expires it. */
export const TRENDS_SUMMARY_TAG = "admin-trends-summary";

export type TrendWeek = {
  /** Monday of the week, `YYYY-MM-DD` in Polish time. */
  start: string;
  /** „28 wrz”. */
  label: string;
};

export type Trends = {
  weeks: TrendWeek[];
  total: number;
  /** Every category, most submissions first; `null` = not categorised yet. */
  byCategory: { category: ChallengeCategory | null; count: number }[];
  /** At most five counties with submissions, most first. */
  topCounties: { code: string; name: string; count: number }[];
  /** Submissions without a county, so the top five never pretend to be all. */
  withoutCounty: number;
  /** Category × week counts; the uncategorised row only when there is one. */
  heat: { category: ChallengeCategory | null; counts: number[] }[];
  weekTotals: number[];
};

const WARSAW_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const WEEK_LABEL = new Intl.DateTimeFormat("pl-PL", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

/** The calendar day in Poland, `YYYY-MM-DD`. */
function warsawDay(date: Date): string {
  return WARSAW_DAY.format(date);
}

function mondayOf(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The last `TREND_WEEKS` weeks, oldest first; the last one is this week. */
export function trendWeeks(now = new Date()): TrendWeek[] {
  const thisMonday = mondayOf(warsawDay(now));
  return Array.from({ length: TREND_WEEKS }, (_, index) => {
    const start = addDays(thisMonday, (index - TREND_WEEKS + 1) * 7);
    return { start, label: WEEK_LABEL.format(new Date(`${start}T00:00:00Z`)).replace(".", "") };
  });
}

type Row = { category: ChallengeCategory | null; county: string | null; created_at: string };

/**
 * Submissions of the window, read page by page. A day of margin before the
 * first Monday covers the UTC offset; rows outside the weeks are dropped later.
 */
async function loadRows(weeks: TrendWeek[]): Promise<Row[]> {
  const supabase = await createClient();
  const from = `${addDays(weeks[0].start, -1)}T00:00:00Z`;
  const rows: Row[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from("submissions")
      .select("category, county, created_at")
      .gte("created_at", from)
      .order("created_at", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw new Error(`trends rows failed: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

/**
 * The three aggregates of ADM3, grouped on demand: by category, the top
 * counties, and category × week. Admins read every submission through RLS.
 */
export async function getTrends(now = new Date()): Promise<Trends> {
  const weeks = trendWeeks(now);
  const weekIndex = new Map(weeks.map((week, index) => [week.start, index]));
  const rows = await loadRows(weeks);

  const categories: (ChallengeCategory | null)[] = [
    ...Constants.public.Enums.challenge_category,
    null,
  ];
  const heat = new Map(categories.map((category) => [category, Array<number>(weeks.length).fill(0)]));
  const counties = new Map<string, number>();
  let withoutCounty = 0;
  let total = 0;

  for (const row of rows) {
    const index = weekIndex.get(mondayOf(warsawDay(new Date(row.created_at))));
    if (index === undefined) continue;
    total++;
    heat.get(row.category)![index]++;
    if (row.county) counties.set(row.county, (counties.get(row.county) ?? 0) + 1);
    else withoutCounty++;
  }

  const sum = (counts: number[]) => counts.reduce((acc, value) => acc + value, 0);
  const heatRows = categories
    .map((category) => ({ category, counts: heat.get(category)! }))
    .filter((row) => row.category !== null || sum(row.counts) > 0);

  return {
    weeks,
    total,
    byCategory: heatRows
      .map((row) => ({ category: row.category, count: sum(row.counts) }))
      .sort((a, b) => b.count - a.count),
    topCounties: [...counties]
      .map(([code, count]) => ({ code, name: countyName(code) ?? code, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pl"))
      .slice(0, TOP_COUNTIES),
    withoutCounty,
    heat: heatRows,
    weekTotals: weeks.map((_, index) => sum(heatRows.map((row) => row.counts[index]))),
  };
}

export function categoryLabel(category: ChallengeCategory | null): string {
  return category ? CHALLENGE_CATEGORY_LABELS[category] : "Bez kategorii";
}

export type TrendsSummary = {
  points: string[];
  proposal: string | null;
  generatedAt: string;
};

const summarySchema = z.object({
  points: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("2–4 obserwacje, każda w 1–2 krótkich zdaniach"),
  proposal: z
    .string()
    .nullable()
    .describe("Jedno zdanie: co ROPS może zrobić; null, gdy dane na to nie pozwalają"),
});

const SYSTEM = `Jesteś analitykiem ROPS Kraków. Co tydzień piszesz zespołowi krótkie podsumowanie zgłoszeń mieszkańców, gmin i organizacji z Małopolski.

Zasady:
- Po polsku, prostym językiem, bez żargonu.
- Tylko to, co wynika z podanych liczb. Nie wymyślaj gmin, przyczyn ani faktów spoza danych.
- Zacznij od tego, co się zmieniło w ostatnich tygodniach: co rośnie, co maleje, gdzie jest najwięcej zgłoszeń.
- Podawaj liczby („z 3 do 12 zgłoszeń tygodniowo”). Ostatni tydzień jeszcze trwa, więc nie porównuj go wprost z pełnymi tygodniami.
- Przy małych liczbach napisz, że to za mało, by mówić o trendzie.`;

function formatTrends(trends: Trends): string {
  const weeks = trends.weeks.map((week) => week.label).join(" | ");
  return [
    `Okres: ${TREND_WEEKS} tygodni od ${trends.weeks[0].label} do dziś; łącznie ${trends.total} zgłoszeń.`,
    "",
    `Zgłoszenia według kategorii, tydzień po tygodniu (${weeks}; ostatni tydzień trwa):`,
    ...trends.heat.map((row) => `- ${categoryLabel(row.category)}: ${row.counts.join(" | ")}`),
    `- Razem: ${trends.weekTotals.join(" | ")}`,
    "",
    "Powiaty z największą liczbą zgłoszeń:",
    ...trends.topCounties.map((county) => `- ${county.name}: ${county.count}`),
    `Bez podanego powiatu: ${trends.withoutCounty}`,
  ].join("\n");
}

async function writeSummary(trends: Trends): Promise<TrendsSummary> {
  const { output } = await generateText({
    model: TEXT_MODEL,
    system: SYSTEM,
    prompt: formatTrends(trends),
    output: Output.object({ schema: summarySchema }),
  });
  return {
    points: output.points.map((point) => point.trim()).filter(Boolean),
    proposal: output.proposal?.trim() || null,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * The AI weekly summary over the counts, cached for an hour per week. The
 * counts come in through the closure, so a new submission does not buy a new
 * model call; „Odśwież podsumowanie” expires the tag instead.
 */
export function getTrendsSummary(trends: Trends): Promise<TrendsSummary> {
  return unstable_cache(
    () => writeSummary(trends),
    [TRENDS_SUMMARY_TAG, trends.weeks.at(-1)!.start],
    { tags: [TRENDS_SUMMARY_TAG], revalidate: 3600 },
  )();
}
