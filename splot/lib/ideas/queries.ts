import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isUuid, type Idea } from "./card";

/** The idea card, when it exists and RLS shows it (the owner or an admin). */
export async function getIdea(id: string): Promise<Idea | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("ideas").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("getIdea failed", error.message);
    return null;
  }
  return data;
}

export type OpenGrantCall = { id: string; title: string; closes_at: string };

/** The grant call from `?call=`, only while it takes applications. */
export async function getOpenGrantCall(id: string | undefined): Promise<OpenGrantCall | null> {
  if (!id) return null;

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grant_calls")
    .select("id, title, closes_at")
    .eq("id", id)
    .lte("opens_at", now)
    .gte("closes_at", now)
    .maybeSingle();
  if (error) {
    console.error("getOpenGrantCall failed", error.message);
    return null;
  }
  return data;
}
