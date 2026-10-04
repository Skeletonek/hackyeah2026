import "server-only";

import { z } from "zod";
import { pageHref, pageRange, toPage, type SearchParams } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

/** The library editor (/admin/library): list filters, one row to edit, the form schema. */

export type VisibilityFilter = "published" | "draft";

export type LibraryAdminFilters = {
  q?: string;
  visibility?: VisibilityFilter;
};

const VISIBILITIES = ["published", "draft"] as const satisfies readonly VisibilityFilter[];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseLibraryAdminFilters(params: SearchParams): LibraryAdminFilters {
  const q = first(params.q)?.trim().slice(0, 200);
  return {
    q: q || undefined,
    visibility: z.enum(VISIBILITIES).safeParse(first(params.visibility)).data,
  };
}

export function hasLibraryAdminFilters(filters: LibraryAdminFilters) {
  return Boolean(filters.q || filters.visibility);
}

/** One page, drafts included: the admin RLS policy reads every row. Recently edited first. */
export async function listLibraryAdmin(filters: LibraryAdminFilters, page: number, params: SearchParams) {
  const supabase = await createClient();
  let query = supabase
    .from("innovations")
    .select("id, slug, title, categories, stage, published, updated_at", { count: "exact" });
  if (filters.q) {
    // `,` `(` `)` are PostgREST `or` syntax, `%` `_` are LIKE wildcards.
    const term = filters.q.replace(/[,()%_\\]/g, " ").trim();
    if (term) query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  if (filters.visibility) query = query.eq("published", filters.visibility === "published");

  const result = await query
    .order("updated_at", { ascending: false })
    .order("id")
    .range(...pageRange(page));
  return toPage(result, page, {
    label: "admin library list",
    href: (n) => pageHref("/admin/library", params, n),
  });
}

export type LibraryAdminRow = Awaited<ReturnType<typeof listLibraryAdmin>>["items"][number];

const EDIT_COLUMNS =
  "id, slug, title, lead, solution, problem, audience, adopters, evidence, easy_read_description, target_groups, categories, stage, source_url, video_url, folder_pdf_url, materials_url, pilot_slots, published, updated_at";

/** One innovation with every editable column, drafts included. */
export async function getInnovationForEdit(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("innovations").select(EDIT_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`admin innovation ${slug} failed: ${error.message}`);
  return data;
}

export type EditableInnovation = NonNullable<Awaited<ReturnType<typeof getInnovationForEdit>>>;
