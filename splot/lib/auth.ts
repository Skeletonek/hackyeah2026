import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/lib/supabase/database.types";

export type CurrentUser = {
  id: string;
  email: string | null;
  /** Anonymous session (submission without an account). */
  isAnonymous: boolean;
  profile: Tables<"profiles"> | null;
};

/** Cookie holding the path to return to after clicking the email link. */
export const NEXT_PATH_COOKIE = "splot_next";

/** Allows only in-app paths (prevents open redirects). */
export function safePath(value: unknown, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}

/**
 * Data Access Layer: the single source of truth about the signed-in person
 * during a render. getClaims() verifies the JWT; never trust getSession() on
 * the server.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email: typeof claims.email === "string" && claims.email ? claims.email : null,
    isAnonymous: claims.is_anonymous === true,
    profile,
  };
});

/** Requires a real account (not an anonymous session). */
export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user || user.isAnonymous) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/**
 * Requires one of the roles. Missing permission = 404, so we don't reveal
 * that the panel exists. This is UX only; RLS protects the data.
 */
export async function requireRole(roles: Enums<"user_role">[], nextPath: string) {
  const user = await requireUser(nextPath);
  if (!user.profile || !roles.includes(user.profile.role)) notFound();
  return user;
}

/**
 * For "submit without an account": if nobody is signed in, start an
 * anonymous session so the submission has an author (RLS) and can later be
 * linked to an account via email.
 */
export async function ensureSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }
  return supabase;
}
