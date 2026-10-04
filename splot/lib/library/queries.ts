import "server-only";
import { z } from "zod";
import { embed } from "@/lib/ai/embed";
import type { ChallengeCategory, InnovationStage, TargetGroup } from "@/lib/labels";
import { pageHref, pageRange, PAGE_SIZE, toPage, type Page, type SearchParams } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";

/** Innovation list (/library): GET filters and the query behind them. */

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

export function libraryHref(params: SearchParams, page: number) {
  return pageHref("/library", params, page);
}

/**
 * One page of published innovations; the filters always run in SQL, over the
 * whole library. With `q`: hybrid search ranks every match, best first.
 * Without `q`: deployed ones first, then by title.
 */
export async function listInnovations(
  filters: LibraryFilters,
  page: number,
  params: SearchParams,
): Promise<Page<LibraryItem>> {
  const supabase = await createClient();
  const href = (n: number) => libraryHref(params, n);

  if (filters.q) {
    // The RPC returns one page of the ranking; the count of the filtered library is its length.
    let count = supabase.from("innovations").select("id", { count: "exact", head: true }).eq("published", true);
    if (filters.category) count = count.contains("categories", [filters.category]);
    if (filters.targetGroup) count = count.contains("target_groups", [filters.targetGroup]);
    if (filters.stage) count = count.eq("stage", filters.stage);

    const [from] = pageRange(page);
    const [embedding, total] = await Promise.all([embed(filters.q), count]);
    if (total.error) throw new Error(`innovations count failed: ${total.error.message}`);
    const { data, error } = await supabase.rpc("match_innovations", {
      query_text: filters.q,
      query_embedding: JSON.stringify(embedding),
      match_count: PAGE_SIZE,
      match_offset: from,
      filter_categories: filters.category ? [filters.category] : undefined,
      filter_stage: filters.stage,
      filter_target_group: filters.targetGroup,
    });
    if (error) throw new Error(`match_innovations failed: ${error.message}`);
    const result = toPage({ data, count: total.count, error: null }, page, { label: "innovations search", href });
    return {
      ...result,
      items: result.items.map(({ id, slug, title, lead, categories, stage }) => ({ id, slug, title, lead, categories, stage })),
    };
  }

  let query = supabase
    .from("innovations")
    .select("id, slug, title, lead, categories, stage", { count: "exact" })
    .eq("published", true);
  if (filters.category) query = query.contains("categories", [filters.category]);
  if (filters.targetGroup) query = query.contains("target_groups", [filters.targetGroup]);
  if (filters.stage) query = query.eq("stage", filters.stage);

  // `innovation_stage` is ordered idea → pilot → deployed, so descending puts deployed first.
  const result = await query
    .order("stage", { ascending: false })
    .order("title")
    .order("id")
    .range(...pageRange(page));
  return toPage(result, page, { label: "innovations list", href });
}
