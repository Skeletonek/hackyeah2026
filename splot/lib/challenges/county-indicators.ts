import { z } from "zod";
import data from "@/data/county-indicators.json";
import { Constants } from "@/lib/supabase/database.types";

/**
 * County indicators from the ROPS observatory (data/county-indicators.json,
 * `pnpm data:indicators`), the regional layer next to the national Mapa
 * Wyzwań Społecznych. Parsed at import, so a broken file fails the build.
 */

const areaKey = z.enum([
  "family_foster_care",
  "homelessness",
  "disability",
  "poverty",
  "foreigners",
  "health",
  "mental_health",
  "seniors",
]);
const category = z.enum(Constants.public.Enums.challenge_category);

const indicator = z.object({
  key: z.string(),
  id: z.number().int(),
  label: z.string(),
  description: z.string(),
  source: z.string(),
  source_url: z.url(),
  year: z.number().int(),
  unit: z.string(),
  direction: z.enum(["higher_worse", "lower_worse"]),
  area: areaKey.nullable(),
  category: category.nullable(),
  derived: z.string().optional(),
  note: z.string().optional(),
});

const county = z.object({
  /** ASCII slug, the same value as `submissions.county`. */
  code: z.string(),
  name: z.string(),
  population: z.number(),
  values: z.record(z.string(), z.number()),
  /** 0 = best in the region, 1 = worst. */
  area_scores: z.partialRecord(areaKey, z.number()),
  category_scores: z.partialRecord(category, z.number()),
  top_areas: z.array(areaKey),
  top_challenges: z.array(category),
});

const countyIndicatorsSchema = z.object({
  source: z.object({ title: z.string(), url: z.url(), note: z.string(), fetched_at: z.string() }),
  method: z.string(),
  indicators: z.array(indicator).min(1),
  counties: z.array(county).length(22),
});

export type CountyIndicators = z.infer<typeof countyIndicatorsSchema>;
export type CountyIndicator = z.infer<typeof indicator>;
export type County = z.infer<typeof county>;

export const countyIndicators: CountyIndicators = countyIndicatorsSchema.parse(data);

export function getCounty(code: string): County | undefined {
  return countyIndicators.counties.find((item) => item.code === code);
}
