import "server-only";
import { z } from "zod";
import shapes from "@/data/malopolska-counties.svg.json";
import { countyIndicators, type County, type CountyIndicator } from "@/lib/challenges/county-indicators";
import { CHALLENGE_CATEGORY_LABELS, type ChallengeCategory } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";

/**
 * Data for the Challenge Map (/challenges): county indicators from D6 joined
 * with live submission counts. Scores are 0–1, where 1 = the hardest
 * situation among the 22 counties of Małopolska.
 */

export const CHALLENGE_CATEGORIES = Constants.public.Enums.challenge_category;

const countyShapesSchema = z.object({
  source: z.object({ title: z.string(), url: z.url(), license: z.string() }),
  viewBox: z.string(),
  counties: z.array(z.object({ code: z.string(), d: z.string().min(1) })).length(22),
});

/** County outlines from `pnpm data:counties`, in the same order as the indicators. */
export const countyShapes = countyShapesSchema.parse(shapes);

/** Score classes, from the easiest to the hardest situation. */
export const LEVELS = [
  { key: "low", label: "niski", min: 0 },
  { key: "medium", label: "umiarkowany", min: 0.25 },
  { key: "high", label: "wysoki", min: 0.5 },
  { key: "very_high", label: "bardzo wysoki", min: 0.75 },
] as const;

export type Level = (typeof LEVELS)[number];

export function scoreLevel(score: number): Level {
  return LEVELS.findLast((level) => score >= level.min) ?? LEVELS[0];
}

/** Other counties a county is compared with. */
export const OTHER_COUNTIES = countyIndicators.counties.length - 1;

/** „Trudniej niż w 15 z 21 powiatów”: the score as a count, which reads better than a fraction. */
export function worseThanCount(score: number) {
  return Math.round(score * OTHER_COUNTIES);
}

export function hasCountyData(category: ChallengeCategory) {
  return countyIndicators.indicators.some((indicator) => indicator.category === category);
}

export function indicatorsFor(category: ChallengeCategory): CountyIndicator[] {
  return countyIndicators.indicators.filter((indicator) => indicator.category === category);
}

export function parseChallenge(value: string | undefined): ChallengeCategory {
  const match = CHALLENGE_CATEGORIES.find((category) => category === value);
  return match ?? "aging";
}

export function parseCounty(value: string | undefined): County | undefined {
  return countyIndicators.counties.find((county) => county.code === value);
}

/** „starzenie się, depopulacja, samotność”: label text inside a sentence. */
export function challengeList(categories: ChallengeCategory[]) {
  return categories.map((category) => CHALLENGE_CATEGORY_LABELS[category].toLowerCase()).join(", ");
}

export type SubmissionCounts = Map<string, { total: number; byCategory: Map<ChallengeCategory, number> }>;

/** Submissions per county from `county_submission_counts()`; empty when the database is out of reach. */
export async function loadSubmissionCounts(): Promise<SubmissionCounts> {
  const counts: SubmissionCounts = new Map();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("county_submission_counts");
    if (error) throw error;
    for (const row of data ?? []) {
      const entry = counts.get(row.county) ?? { total: 0, byCategory: new Map() };
      entry.total += row.count;
      entry.byCategory.set(row.category, row.count);
      counts.set(row.county, entry);
    }
  } catch (error) {
    console.error("county_submission_counts failed", error);
  }
  return counts;
}
