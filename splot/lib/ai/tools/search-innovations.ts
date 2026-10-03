import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { embed } from "@/lib/ai/embed";
import { Constants, type Database, type Enums } from "@/lib/supabase/database.types";

export const searchInnovationsInput = z.object({
  query: z.string().trim().min(2).max(1000).describe("Opis problemu lub potrzeby, po polsku."),
  categories: z
    .array(z.enum(Constants.public.Enums.challenge_category))
    .optional()
    .describe("Zawęża wyniki do kategorii wyzwań."),
  limit: z.number().int().min(1).max(8).default(5),
});

export type InnovationMatch = {
  id: string;
  slug: string;
  title: string;
  lead: string | null;
  categories: Enums<"challenge_category">[];
  stage: Enums<"innovation_stage">;
  score: number;
};

/** Hybrid (vector + full-text) search over published innovations. */
export async function searchInnovations(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof searchInnovationsInput>,
): Promise<InnovationMatch[]> {
  const embedding = await embed(input.query);

  // `match_innovations` comes from the Data contract migration (SPL-18);
  // drop the cast once database.types.ts is regenerated with it.
  const { data, error } = await (supabase as SupabaseClient).rpc("match_innovations", {
    query_text: input.query,
    query_embedding: JSON.stringify(embedding),
    match_count: input.limit,
    filter_categories: input.categories?.length ? input.categories : null,
  });
  if (error) throw new Error(`match_innovations failed: ${error.message}`);

  return (data ?? []) as InnovationMatch[];
}
