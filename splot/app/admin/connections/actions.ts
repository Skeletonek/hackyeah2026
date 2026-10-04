"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { notify } from "@/lib/notifications/notify";
import { createClient } from "@/lib/supabase/server";

/**
 * Server actions for /admin/connections (SPL-48).
 * Only admins can accept or dismiss connection requests.
 */

const actionSchema = z.object({
  requestId: z.uuid(),
});

const OPENING_MESSAGE =
  "ROPS połączył Wasze zgłoszenia, żebyście mogli wspólnie rozwinąć to rozwiązanie.";

function revalidate() {
  revalidatePath("/admin/connections");
  revalidatePath("/account/messages");
}

export async function acceptConnection(formData: FormData): Promise<void> {
  const user = await requireRole(["admin"], "/admin/connections");
  const parsed = actionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();

  // Load the request with both submission sides.
  const { data: request, error: readError } = await supabase
    .from("connection_requests")
    .select(
      `
      id,
      from:from_submission_id (id, case_number, author_id),
      to:to_submission_id (id, case_number, author_id)
    `,
    )
    .eq("id", parsed.data.requestId)
    .eq("status", "pending")
    .maybeSingle();
  if (readError) {
    console.error("acceptConnection read failed", parsed.data.requestId, readError);
    return;
  }
  if (!request) return;

  const fromSub = request.from as unknown as { id: string; case_number: string; author_id: string };
  const toSub = request.to as unknown as { id: string; case_number: string; author_id: string };
  const subject = `Partnerstwo: ${fromSub.case_number} i ${toSub.case_number}`;

  // Create the thread, participants, opening message and update the request.
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .insert({ subject, submission_id: fromSub.id })
    .select("id")
    .single();
  if (threadError || !thread) {
    console.error("acceptConnection thread failed", parsed.data.requestId, threadError);
    return;
  }

  const participants = [
    { thread_id: thread.id, user_id: fromSub.author_id },
    { thread_id: thread.id, user_id: toSub.author_id },
    { thread_id: thread.id, user_id: user.id },
  ];
  const [{ error: participantsError }, { error: messageError }, { error: updateError }] =
    await Promise.all([
      supabase.from("thread_participants").insert(participants),
      supabase.from("messages").insert({
        thread_id: thread.id,
        body: OPENING_MESSAGE,
        author_id: user.id,
        from_assistant: false,
      }),
      supabase
        .from("connection_requests")
        .update({ status: "accepted", thread_id: thread.id })
        .eq("id", parsed.data.requestId),
    ]);

  if (participantsError) {
    console.error("acceptConnection participants failed", parsed.data.requestId, participantsError);
  }
  if (messageError) {
    console.error("acceptConnection message failed", parsed.data.requestId, messageError);
  }
  if (updateError) {
    console.error("acceptConnection update failed", parsed.data.requestId, updateError);
    return;
  }

  // Notify both authors.
  const link = `/account/messages`;
  await Promise.all([
    notify({
      type: "thread_reply",
      recipientId: fromSub.author_id,
      submissionId: fromSub.id,
      title: `ROPS połączył Twoje zgłoszenie z ${toSub.case_number}`,
      link,
    }),
    notify({
      type: "thread_reply",
      recipientId: toSub.author_id,
      submissionId: toSub.id,
      title: `ROPS połączył Twoje zgłoszenie z ${fromSub.case_number}`,
      link,
    }),
  ]);

  revalidate();
}

export async function dismissConnection(formData: FormData): Promise<void> {
  await requireRole(["admin"], "/admin/connections");
  const parsed = actionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("connection_requests")
    .update({ status: "dismissed" })
    .eq("id", parsed.data.requestId)
    .eq("status", "pending");
  if (error) {
    console.error("dismissConnection failed", parsed.data.requestId, error);
    return;
  }

  revalidate();
}
