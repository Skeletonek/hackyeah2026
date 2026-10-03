import "server-only";
import type { UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Resume: a page reads `?c=<id>` and passes the result to `useSkillChat` as
 * `initialMessages`. Empty for a new, foreign (RLS) or malformed id.
 */
export async function loadConversationMessages(
  skill: string,
  conversationId: string | string[] | undefined,
): Promise<UIMessage[]> {
  const id = z.uuid().safeParse(conversationId);
  if (!id.success) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("messages")
    .eq("id", id.data)
    .eq("skill", skill)
    .maybeSingle();

  return (data?.messages ?? []) as unknown as UIMessage[];
}
