import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import type { OrganizationType, PilotStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Pilot application and review data layer for the Library Tester module (SPL-38).
 * Reads use the request-scoped Supabase client (RLS); mutations require an
 * authenticated user because the schema grants write access only to authenticated.
 */

export type UserPilot = {
  id: string;
  status: PilotStatus;
  organizationType: OrganizationType;
  municipality: string;
  plan: string | null;
  contactEmail: string;
  createdAt: string;
};

export type PilotReview = {
  id: string;
  rating: number;
  feedback: string | null;
  improvement: string | null;
  attribution: string;
};

export type PilotApplicationValues = {
  organizationType: OrganizationType;
  municipality: string;
  plan?: string;
  contactEmail: string;
};

export type PilotReviewValues = {
  rating: number;
  feedback?: string;
  improvement?: string;
  attribution: string;
};

/** True when the current session can read its own pilot row. */
async function isAuthenticatedUser() {
  const user = await getCurrentUser();
  return user !== null && !user.isAnonymous;
}

export const getUserPilot = cache(async (innovationId: string): Promise<UserPilot | null> => {
  if (!(await isAuthenticatedUser())) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pilots")
    .select("id, status, organization_type, municipality, plan, contact_email, created_at")
    .eq("innovation_id", innovationId)
    .maybeSingle();
  if (error) throw new Error(`getUserPilot failed: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    organizationType: data.organization_type,
    municipality: data.municipality,
    plan: data.plan,
    contactEmail: data.contact_email,
    createdAt: data.created_at,
  };
});

/** Approved public reviews for the innovation page, newest first. */
export async function getPublicPilotReviews(
  innovationId: string,
  limit = 3,
): Promise<PilotReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_pilot_reviews", {
    p_innovation_id: innovationId,
  });
  if (error) throw new Error(`getPublicPilotReviews failed: ${error.message}`);
  return (data ?? []).slice(0, limit).map((row) => ({
    id: row.id,
    rating: row.rating,
    feedback: row.feedback,
    improvement: row.improvement,
    attribution: row.attribution,
  }));
}

/** The current user's review for a pilot, if it exists. */
export async function getUserPilotReview(pilotId: string): Promise<PilotReview | null> {
  if (!(await isAuthenticatedUser())) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pilot_reviews")
    .select("id, rating, feedback, improvement, attribution")
    .eq("pilot_id", pilotId)
    .maybeSingle();
  if (error) throw new Error(`getUserPilotReview failed: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    rating: data.rating,
    feedback: data.feedback,
    improvement: data.improvement,
    attribution: data.attribution,
  };
}

type ApplyResult =
  | { ok: true; pilot: Tables<"pilots"> }
  | { ok: false; existing: UserPilot; error: string };

/**
 * Apply to test an innovation. Requires an authenticated user (the schema
 * grants insert only to authenticated). On unique violation, returns the
 * existing pilot so the page can show its status.
 */
export async function applyForPilot(
  innovationId: string,
  values: PilotApplicationValues,
): Promise<ApplyResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pilots")
    .insert({
      innovation_id: innovationId,
      organization_type: values.organizationType,
      municipality: values.municipality.trim(),
      plan: values.plan?.trim() || null,
      contact_email: values.contactEmail.trim(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      const existing = await getUserPilot(innovationId);
      if (existing) {
        return { ok: false, existing, error: "Już zgłosiłeś się do testowania tej innowacji." };
      }
    }
    throw new Error(`applyForPilot failed: ${error.message}`);
  }

  return { ok: true, pilot: data };
}

/**
 * Save or update the user's review. Reviews are one per pilot; the row is
 * editable until an admin marks it as approved. RLS verifies that the user
 * owns an active pilot via `owns_active_pilot(pilot_id)`.
 */
export async function savePilotReview(
  pilotId: string,
  values: PilotReviewValues,
): Promise<Tables<"pilot_reviews">> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pilot_reviews")
    .upsert(
      {
        pilot_id: pilotId,
        rating: values.rating,
        feedback: values.feedback?.trim() || null,
        improvement: values.improvement?.trim() || null,
        attribution: values.attribution.trim(),
      },
      { onConflict: "pilot_id" },
    )
    .select()
    .single();
  if (error) throw new Error(`savePilotReview failed: ${error.message}`);
  if (!data) throw new Error("savePilotReview returned no row");
  return data;
}
