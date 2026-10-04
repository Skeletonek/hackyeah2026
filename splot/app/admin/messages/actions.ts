"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { notify } from "@/lib/notifications/notify";
import { createClient } from "@/lib/supabase/server";
import { toStaffThreadMessage, type StaffThreadMessage } from "@/lib/threads/messages";
import { getStaffThread } from "@/lib/threads/queries";
import { draftReply, type ReplyDraft } from "@/lib/threads/reply-draft";

const replySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Napisz odpowiedź, zanim ją wyślesz.")
    .max(10000, "Odpowiedź jest za długa. Skróć ją albo podziel na dwie."),
});

export type StaffReplyState =
  | { status: "idle" }
  | { status: "sent"; message: StaffThreadMessage }
  | { status: "error"; error: string };

/** ROPS's reply in a submission thread, then a notification to the author (bell + e-mail). */
export async function sendStaffReply(
  submissionId: string,
  _previous: StaffReplyState,
  formData: FormData,
): Promise<StaffReplyState> {
  const user = await requireRole(["admin"], "/admin/messages");

  const parsed = replySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Nie udało się wysłać odpowiedzi." };
  }

  const thread = await getStaffThread(submissionId, user.id);
  if (!thread?.threadId) return { status: "error", error: "Nie znaleziono wątku tego zgłoszenia." };
  const { submission } = thread;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ thread_id: thread.threadId, body: parsed.data.body })
    .select("id, body, created_at, author_id")
    .single();
  if (error) {
    console.error("sendStaffReply failed", submissionId, error);
    return { status: "error", error: "Nie udało się wysłać odpowiedzi. Spróbuj jeszcze raz za chwilę." };
  }

  // The reply is saved either way; notify() never throws.
  await notify({
    type: "thread_reply",
    recipientId: submission.authorId,
    submissionId: submission.id,
    title: `ROPS odpowiedział w sprawie zgłoszenia ${submission.caseNumber}`,
    link: `/account/submissions/${submission.id}`,
    email: submission.contactEmail ?? undefined,
  });

  revalidatePath("/admin/messages");
  return { status: "sent", message: toStaffThreadMessage(data, submission.authorId, user.id) };
}

export type ReplyDraftResult = { ok: true; draft: ReplyDraft } | { ok: false; error: string };

/** „Zaproponuj odpowiedź”: an AI draft for the admin to edit. Writes nothing. */
export async function suggestReply(submissionId: string): Promise<ReplyDraftResult> {
  const user = await requireRole(["admin"], "/admin/messages");

  const thread = await getStaffThread(submissionId, user.id);
  if (!thread) return { ok: false, error: "Nie znaleziono zgłoszenia." };

  try {
    return { ok: true, draft: await draftReply(thread) };
  } catch (error) {
    console.error("suggestReply failed", submissionId, error);
    return { ok: false, error: "Nie udało się przygotować szkicu. Spróbuj ponownie albo napisz odpowiedź samodzielnie." };
  }
}
