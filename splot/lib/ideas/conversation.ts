import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Create first: ideas.conversation_id is a foreign key to conversations. */
export async function linkIdeaConversation(
  supabase: SupabaseClient<Database>,
  userId: string,
  ideaId: string,
  conversationId: string,
) {
  const { error: createError } = await supabase.from("conversations").upsert(
    { id: conversationId, skill: "idea-assistant" },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (createError) throw new Error(`create idea conversation failed: ${createError.message}`);

  // RLS also lets admins read other conversations: explicitly require ownership.
  const { data: conversation, error: loadError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .eq("skill", "idea-assistant")
    .maybeSingle();
  if (loadError || !conversation) throw new Error("idea conversation unavailable");

  const { data: idea, error: linkError } = await supabase
    .from("ideas")
    .update({ conversation_id: conversationId })
    .eq("id", ideaId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (linkError || !idea) throw new Error("link idea conversation failed");
}
