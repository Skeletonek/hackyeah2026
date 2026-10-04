"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type MarkReadResult = { ok: true } | { ok: false; error: string };

const FAILED = "Nie udało się oznaczyć powiadomień. Spróbuj ponownie.";

/**
 * Marks one notification (`id`) or all unread ones as read. RLS lets the
 * recipient change only `read_at` on their own rows. `refresh()` updates the
 * bell, which lives in a layout that navigation does not re-render.
 */
export async function markNotificationsRead(id?: string): Promise<MarkReadResult> {
  if (id !== undefined && !z.uuid().safeParse(id).success) return { ok: false, error: FAILED };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: FAILED };

  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (id) query = query.eq("id", id);

  const { error } = await query;
  if (error) {
    console.error("markNotificationsRead failed", error.message);
    return { ok: false, error: FAILED };
  }

  refresh();
  return { ok: true };
}
