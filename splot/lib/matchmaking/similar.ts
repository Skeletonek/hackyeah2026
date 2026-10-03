import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { embed } from "@/lib/ai/embed";
import type { ChallengeCategory } from "@/lib/labels";
import type { Database } from "@/lib/supabase/database.types";

export const MAX_SIMILAR_SUBMISSIONS = 3;
/** The RPC always returns the nearest cases; below this they are not about the same problem. */
const MIN_SIMILARITY = 0.5;
/** Fetched with a margin, because rows without a summary or below the threshold drop out. */
const CANDIDATES = 8;

/** What a person may see of someone else's submission: never the body. */
export type SimilarSubmission = {
  id: string;
  municipality: string | null;
  county: string | null;
  category: ChallengeCategory | null;
  summary: string;
};

/** Triaged submissions about a similar problem, most similar first. */
export async function similarSubmissions(
  supabase: SupabaseClient<Database>,
  description: string,
  excludeId?: string | null,
): Promise<SimilarSubmission[]> {
  const embedding = await embed(description);

  const { data, error } = await supabase.rpc("similar_submissions", {
    query_embedding: JSON.stringify(embedding),
    match_count: CANDIDATES,
    exclude_id: excludeId ?? undefined,
  });
  if (error) throw new Error(`similar_submissions failed: ${error.message}`);

  return (data ?? [])
    .filter((row) => row.similarity >= MIN_SIMILARITY && row.ai_summary?.trim())
    .slice(0, MAX_SIMILAR_SUBMISSIONS)
    .map((row) => ({
      id: row.id,
      municipality: row.municipality,
      county: row.county,
      category: row.category,
      summary: row.ai_summary,
    }));
}
