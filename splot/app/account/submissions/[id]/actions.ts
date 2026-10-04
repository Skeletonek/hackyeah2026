"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toThreadMessage, type ThreadMessage } from "@/lib/threads/messages";

/**
 * The author's reply in the submission thread (SPL-58). RLS lets only thread
 * participants write, and only as themselves, so a foreign thread id fails
 * at the insert.
 */

const replySchema = z.object({
  threadId: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Napisz wiadomość, zanim ją wyślesz.")
    .max(10000, "Wiadomość jest za długa. Skróć ją albo podziel na dwie."),
});

export type ReplyState =
  | { status: "idle" }
  | { status: "sent"; message: ThreadMessage }
  | { status: "error"; error: string };

export async function sendReply(
  submissionId: string,
  _previous: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  const user = await requireUser(`/account/submissions/${submissionId}`);

  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Nie udało się wysłać wiadomości." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ thread_id: parsed.data.threadId, body: parsed.data.body })
    .select("id, body, created_at, author_id")
    .single();
  if (error) {
    return { status: "error", error: "Nie udało się wysłać wiadomości. Spróbuj jeszcze raz za chwilę." };
  }

  return { status: "sent", message: toThreadMessage(data, user.id) };
}
