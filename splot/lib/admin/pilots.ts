import "server-only";

import { z } from "zod";
import type { PilotStatus } from "@/lib/labels";
import { Constants } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Pilot and review moderation (/admin/pilots). A review is moderated once
 * `approved` is true: then it is either public (`is_public`) or hidden.
 */

export const PILOT_TABS = ["applications", "reviews"] as const;
export type PilotTab = (typeof PILOT_TABS)[number];

export const REVIEW_STATES = ["pending", "published", "hidden"] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export type PilotFilters = {
  tab: PilotTab;
  status?: PilotStatus;
  /** Reviews tab only; „Do akceptacji” when omitted. */
  review: ReviewState;
};

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePilotFilters(params: SearchParams): PilotFilters {
  return {
    tab: z.enum(PILOT_TABS).catch("applications").parse(first(params.tab)),
    status: z.enum(Constants.public.Enums.pilot_status).safeParse(first(params.status)).data,
    review: z.enum(REVIEW_STATES).catch("pending").parse(first(params.review)),
  };
}

/** Every application under the admin RLS policy, newest first. */
export async function listPilots(status: PilotStatus | undefined) {
  const supabase = await createClient();
  let query = supabase
    .from("pilots")
    .select(
      "id, organization_type, municipality, plan, contact_email, status, created_at, innovation:innovations(title, slug)",
    );
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`admin pilots list failed: ${error.message}`);
  return data;
}

export type PilotRow = Awaited<ReturnType<typeof listPilots>>[number];

export async function listReviews(state: ReviewState) {
  const supabase = await createClient();
  let query = supabase
    .from("pilot_reviews")
    .select(
      "id, rating, feedback, improvement, attribution, is_public, approved, created_at, pilot:pilots(municipality, organization_type, innovation:innovations(title, slug))",
    )
    .eq("approved", state !== "pending");
  if (state !== "pending") query = query.eq("is_public", state === "published");

  // The oldest pending review waits longest, so it comes first.
  const { data, error } = await query.order("created_at", { ascending: state === "pending" });
  if (error) throw new Error(`admin reviews list failed: ${error.message}`);
  return data;
}

export type ReviewRow = Awaited<ReturnType<typeof listReviews>>[number];

/** Counts on the tabs: applications to answer and reviews to moderate. */
export async function countPilotWork() {
  const supabase = await createClient();
  const [applied, pending] = await Promise.all([
    supabase.from("pilots").select("id", { count: "exact", head: true }).eq("status", "applied"),
    supabase.from("pilot_reviews").select("id", { count: "exact", head: true }).eq("approved", false),
  ]);
  return { applied: applied.count ?? 0, pending: pending.count ?? 0 };
}
