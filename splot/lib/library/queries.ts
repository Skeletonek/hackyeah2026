import "server-only";
import { z } from "zod";
import { searchInnovations } from "@/lib/ai/tools/search-innovations";
import type { ChallengeCategory, InnovationStage, TargetGroup } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";

/** Innovation list (/library): GET filters and the query behind them. */

/** How many results a search returns; without `q` the whole library is listed. */
const SEARCH_LIMIT = 24;

const MIN_QUERY_LENGTH = 2;

export type LibraryFilters = {
  q?: string;
  category?: ChallengeCategory;
  targetGroup?: TargetGroup;
  stage?: InnovationStage;
};

export type LibraryItem = {
  id: string;
  slug: string;
  title: string;
  lead: string | null;
  categories: ChallengeCategory[];
  stage: InnovationStage;
};

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** An unknown or empty value („Wszystkie”) means no filter. */
function oneOf<T extends string>(values: readonly T[], value: string | undefined): T | undefined {
  return z.enum(values as [T, ...T[]]).safeParse(value).data;
}

export function parseLibraryFilters(params: SearchParams): LibraryFilters {
  const q = first(params.q)?.trim().slice(0, 200);
  return {
    q: q && q.length >= MIN_QUERY_LENGTH ? q : undefined,
    category: oneOf(Constants.public.Enums.challenge_category, first(params.category)),
    targetGroup: oneOf(Constants.public.Enums.target_group, first(params.target_group)),
    stage: oneOf(Constants.public.Enums.innovation_stage, first(params.stage)),
  };
}

export function hasFilters(filters: LibraryFilters) {
  return Boolean(filters.q || filters.category || filters.targetGroup || filters.stage);
}

/**
 * With `q`: hybrid search (best match first), then the other filters.
 * Without `q`: published innovations, deployed ones first, then by title.
 */
export async function listInnovations(filters: LibraryFilters): Promise<LibraryItem[]> {
  const supabase = await createClient();

  if (filters.q) {
    const matches = await searchInnovations(supabase, {
      query: filters.q,
      categories: filters.category ? [filters.category] : undefined,
      limit: SEARCH_LIMIT,
    });
    let items = filters.stage ? matches.filter((item) => item.stage === filters.stage) : matches;

    // The search result has no target groups, so this filter needs one more read.
    if (filters.targetGroup && items.length > 0) {
      const { data, error } = await supabase
        .from("innovations")
        .select("id")
        .in(
          "id",
          items.map((item) => item.id),
        )
        .contains("target_groups", [filters.targetGroup]);
      if (error) throw new Error(`innovations target group filter failed: ${error.message}`);
      const ids = new Set(data.map((row) => row.id));
      items = items.filter((item) => ids.has(item.id));
    }

    return items.map(({ id, slug, title, lead, categories, stage }) => ({ id, slug, title, lead, categories, stage }));
  }

  let query = supabase.from("innovations").select("id, slug, title, lead, categories, stage").eq("published", true);
  if (filters.category) query = query.contains("categories", [filters.category]);
  if (filters.targetGroup) query = query.contains("target_groups", [filters.targetGroup]);
  if (filters.stage) query = query.eq("stage", filters.stage);

  // `innovation_stage` is ordered idea → pilot → deployed, so descending puts deployed first.
  const { data, error } = await query.order("stage", { ascending: false }).order("title");
  if (error) throw new Error(`innovations list failed: ${error.message}`);
  return data;
}
