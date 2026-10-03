import { z } from "zod";
import data from "@/data/challenge-map.json";
import { Constants } from "@/lib/supabase/database.types";

/**
 * ROPS „Mapa Wyzwań Społecznych”, transcribed from the PDF into
 * data/challenge-map.json (SPL-21). The data is national, not regional.
 * Parsed at import, so a typo in the JSON fails the build instead of the page.
 */

const link = z.object({ title: z.string().min(1), url: z.url() });

const persona = z.object({
  name: z.string().min(1),
  description: z.array(z.string().min(1)).min(1),
  goals: z.array(z.string().min(1)).min(1),
  challenges: z.array(z.string().min(1)).min(1),
  motivations: z.array(z.string().min(1)).min(1),
});

const area = z.object({
  key: z.string().min(1),
  number: z.number().int(),
  title: z.string().min(1),
  /** First and last slide of the area in the source PDF (for `#page=` links). */
  slides: z.tuple([z.number().int(), z.number().int()]),
  /** Empty for Ubóstwo: its „Definicja obszaru” slide holds only figures (they are in `facts`). */
  definition: z.array(z.string().min(1)),
  /** Empty for Bezdomność: the Mapa has no „Analiza danych zastanych” slide for it. */
  facts: z.array(z.string().min(1)),
  sources: z.array(link),
  challenges: z.array(z.string().min(1)).min(1),
  personas: z.array(persona).min(1),
  reports: z.array(link).min(1),
  related_categories: z.array(z.enum(Constants.public.Enums.challenge_category)).min(1),
  related_target_groups: z.array(z.enum(Constants.public.Enums.target_group)).min(1),
});

const challengeMapSchema = z.object({
  source: z.object({
    title: z.string(),
    publisher: z.string(),
    url: z.url(),
    note: z.string(),
  }),
  areas: z.array(area).length(8),
});

export type ChallengeMap = z.infer<typeof challengeMapSchema>;
export type ChallengeArea = z.infer<typeof area>;
export type ChallengePersona = z.infer<typeof persona>;

export const challengeMap: ChallengeMap = challengeMapSchema.parse(data);

export function getChallengeArea(key: string): ChallengeArea | undefined {
  return challengeMap.areas.find((item) => item.key === key);
}

/** Link to the area's first slide in the source PDF. */
export function challengeAreaSourceUrl(item: ChallengeArea) {
  return `${challengeMap.source.url}#page=${item.slides[0]}`;
}
