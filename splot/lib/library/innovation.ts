import "server-only";
import { cache } from "react";
import type { OrganizationType, PilotStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

/** One innovation page (/library/[slug]) and the public numbers behind it. */

const INNOVATION_COLUMNS =
  "id, slug, title, lead, solution, problem, audience, adopters, evidence, easy_read_description, categories, stage, pilot_slots, source_url, video_url, folder_pdf_url, materials_url";

/**
 * A published innovation, or null. Admins and authors can read drafts through
 * RLS, so the `published` filter is explicit: drafts never get a public page.
 * Cached per request, so metadata and the page share one query.
 */
export const getPublishedInnovation = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("innovations")
    .select(INNOVATION_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(`innovation ${slug} failed: ${error.message}`);
  return data;
});

export type Innovation = NonNullable<Awaited<ReturnType<typeof getPublishedInnovation>>>;

export type PilotPlace = {
  municipality: string;
  organizationType: OrganizationType;
  status: Extract<PilotStatus, "in_progress" | "completed">;
};

/** „Gdzie już działa”: places testing or done testing, finished ones first. */
export async function getPilotPlaces(innovationId: string): Promise<PilotPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_pilot_places", { p_innovation_id: innovationId });
  if (error) throw new Error(`public_pilot_places failed: ${error.message}`);
  return data.map((row) => ({
    municipality: row.municipality,
    organizationType: row.organization_type,
    status: row.status as PilotPlace["status"],
  }));
}

export type PilotStats = {
  /** Null until the first approved public review. */
  avgRating: number | null;
  reviewCount: number;
  activePilots: number;
};

/** Rating and pilot counts for the Tester aside (L3). */
export async function getPilotStats(innovationId: string): Promise<PilotStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pilot_stats", { p_innovation_id: innovationId });
  if (error) throw new Error(`pilot_stats failed: ${error.message}`);
  const row = data[0];
  return {
    avgRating: row?.avg_rating ?? null,
    reviewCount: row?.review_count ?? 0,
    activePilots: row?.active_pilots ?? 0,
  };
}

/**
 * A YouTube link as a privacy-friendly embed with Polish captions switched on.
 * Null for other providers: the page then shows only the text link.
 */
export function youtubeEmbedUrl(videoUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  const id =
    host === "youtu.be"
      ? url.pathname.slice(1)
      : host === "youtube.com" || host === "m.youtube.com"
        ? url.searchParams.get("v")
        : null;
  if (!id || !/^[\w-]{11}$/.test(id)) return null;

  const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  embed.searchParams.set("cc_load_policy", "1");
  embed.searchParams.set("cc_lang_pref", "pl");
  embed.searchParams.set("hl", "pl");
  embed.searchParams.set("rel", "0");
  const start = Number.parseInt(url.searchParams.get("t") ?? "", 10);
  if (start > 0) embed.searchParams.set("start", String(start));
  return embed.toString();
}
