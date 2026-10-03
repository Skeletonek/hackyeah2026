import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Enums } from "@/lib/supabase/database.types";

export const getInnovationInput = z.object({
  slug: z.string().trim().min(1).max(200).describe("Slug innowacji z wyników wyszukiwania."),
});

export type InnovationDetails = {
  slug: string;
  title: string;
  lead: string | null;
  solution: string | null;
  problem: string | null;
  audience: string | null;
  adopters: string | null;
  evidence: string | null;
  stage: Enums<"innovation_stage">;
  categories: Enums<"challenge_category">[];
  target_groups: Enums<"target_group">[];
  source_url: string | null;
};

const COLUMNS =
  "slug, title, lead, solution, problem, audience, adopters, evidence, stage, categories, target_groups, source_url";

/** One published innovation in full, or `null` when the slug is unknown. */
export async function getInnovation(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof getInnovationInput>,
): Promise<InnovationDetails | null> {
  const { data, error } = await supabase
    .from("innovations")
    .select(COLUMNS)
    .eq("slug", input.slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(`getInnovation failed: ${error.message}`);

  return data;
}
