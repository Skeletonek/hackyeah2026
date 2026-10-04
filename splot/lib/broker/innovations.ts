import "server-only";

import libraryFallback from "@/data/rops-library.json";
import { PAGE_SIZE } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

export type BrokerInnovationOption = { slug: string; title: string };

export type BrokerInnovationResults = {
  /** One page of matches, by title. */
  items: BrokerInnovationOption[];
  /** Every match, so the form can say how many it does not show. */
  total: number;
};

/** `,` `(` `)` are PostgREST `or` syntax, `%` `_` are LIKE wildcards. */
function likeTerm(query: string) {
  return query.replace(/[,()%_\\]/g, " ").trim().slice(0, 100);
}

/**
 * Published innovations whose title contains `query` (all of them when empty),
 * one page by title. Falls back to the bundled library JSON without a database.
 */
export async function searchBrokerInnovations(query: string): Promise<BrokerInnovationResults> {
  const term = likeTerm(query);
  try {
    const supabase = await createClient();
    let request = supabase
      .from("innovations")
      .select("slug, title", { count: "exact" })
      .eq("published", true);
    if (term) request = request.ilike("title", `%${term}%`);
    const { data, count, error } = await request.order("title").order("id").range(0, PAGE_SIZE - 1);
    if (!error && count) return { items: data, total: count };
    if (!error && term) return { items: [], total: 0 };
  } catch {
    // Local JSON below.
  }

  const needle = term.toLocaleLowerCase("pl");
  const matches = (libraryFallback as BrokerInnovationOption[])
    .filter((item) => item.title.toLocaleLowerCase("pl").includes(needle))
    .map(({ slug, title }) => ({ slug, title }))
    .sort((a, b) => a.title.localeCompare(b.title, "pl"));
  return { items: matches.slice(0, PAGE_SIZE), total: matches.length };
}

/** The innovation behind `?innovation=<slug>`, so a link from its page is preselected. */
export async function getBrokerInnovation(slug: string): Promise<BrokerInnovationOption | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("innovations")
      .select("slug, title")
      .eq("published", true)
      .eq("slug", slug)
      .maybeSingle();
    if (data) return data;
  } catch {
    // Local JSON below.
  }
  const item = (libraryFallback as BrokerInnovationOption[]).find((entry) => entry.slug === slug);
  return item ? { slug: item.slug, title: item.title } : null;
}
