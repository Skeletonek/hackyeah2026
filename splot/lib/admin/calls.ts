import "server-only";

import { callStatus, type CallStatus } from "@/lib/admin/call-fields";
import { createClient } from "@/lib/supabase/server";

/** The grant call configurator (/admin/calls): the list and one call to edit. */

const STATUS_ORDER: Record<CallStatus, number> = { open: 0, planned: 1, closed: 2 };

/** Open calls first, then planned, then closed; the latest deadline first within each. */
export async function listCallsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grant_calls")
    .select("id, title, opens_at, closes_at, category, sections, criteria")
    .order("closes_at", { ascending: false });
  if (error) throw new Error(`admin calls list failed: ${error.message}`);

  const now = new Date();
  return data
    .map((call) => ({ ...call, status: callStatus(call, now) }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

export type CallAdminRow = Awaited<ReturnType<typeof listCallsAdmin>>[number];

export async function getCallForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grant_calls")
    .select("id, title, description, opens_at, closes_at, category, sections, criteria")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`admin call ${id} failed: ${error.message}`);
  return data;
}

export type EditableCall = NonNullable<Awaited<ReturnType<typeof getCallForEdit>>>;
