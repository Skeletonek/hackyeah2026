"use server";

import type { UIMessage } from "ai";
import { z } from "zod";
import { ensureSession } from "@/lib/auth";
import { countyName } from "@/lib/labels";
import { matchSubmissionBody } from "@/lib/matchmaking/submission-body";
import { notify } from "@/lib/notifications/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { onSubmissionCreated, trackingLink, type CreatedSubmission } from "@/lib/submissions/on-created";

/** Empty form fields arrive as "", which means „not given”. */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || undefined);

const saveMatchSubmissionInput = z.object({
  conversationId: z.uuid(),
  municipality: optionalText(100, "Nazwa gminy może mieć najwyżej 100 znaków."),
  county: optionalText(40, "Wybierz powiat z listy.").refine(
    (code) => code === undefined || countyName(code) !== undefined,
    "Wybierz powiat z listy.",
  ),
  contactEmail: optionalText(254, "Adres e-mail jest za długi.").pipe(
    z.email("Wpisz adres z małpą (@), np. jan@poczta.pl.").optional(),
  ),
});

export type SaveMatchSubmissionInput = z.input<typeof saveMatchSubmissionInput>;

export type SavedSubmission = {
  id: string;
  caseNumber: string;
  /** In-app path `/status/<case>/<token>`. */
  trackingUrl: string;
  contactEmail: string | null;
};

export type SaveMatchSubmissionResult =
  | ({ ok: true } & SavedSubmission)
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<keyof SaveMatchSubmissionInput, string[]>>;
    };

const SUBMISSION_COLUMNS = "id, case_number, tracking_token, author_id, contact_email";

function saved(sub: CreatedSubmission): SaveMatchSubmissionResult {
  return {
    ok: true,
    id: sub.id,
    caseNumber: sub.case_number,
    trackingUrl: trackingLink(sub),
    contactEmail: sub.contact_email,
  };
}

const failed = (error: string): SaveMatchSubmissionResult => ({ ok: false, error });
const RETRY = "Nie udało się zapisać zgłoszenia. Spróbuj jeszcze raz za chwilę.";

/**
 * Turns a matchmaking conversation into a submission, only on an explicit
 * click („Zapisz wyniki”, „Wyślij mi na e-mail”, „Zgłoś jako wyzwanie”,
 * „Połącz się”, „Zapytaj eksperta”). Idempotent per conversation: the second
 * call returns the same submission.
 */
export async function saveMatchSubmission(
  input: SaveMatchSubmissionInput,
): Promise<SaveMatchSubmissionResult> {
  const parsed = saveMatchSubmissionInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Popraw zaznaczone pola.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { conversationId, municipality, county, contactEmail } = parsed.data;

  const supabase = await ensureSession();

  // RLS: only the owner's conversation is visible.
  const { data: conversation, error: loadError } = await supabase
    .from("conversations")
    .select("submission_id, messages")
    .eq("id", conversationId)
    .eq("skill", "matchmaking")
    .maybeSingle();
  if (loadError) return failed(RETRY);
  if (!conversation) return failed("Nie znaleźliśmy tej rozmowy. Opisz problem jeszcze raz.");

  if (conversation.submission_id) {
    return existingSubmission(supabase, conversation.submission_id, contactEmail);
  }

  const body = matchSubmissionBody(conversation.messages as unknown as UIMessage[]);
  if (body.length < 3) return failed("Najpierw opisz problem, a potem zapisz zgłoszenie.");

  const { data: sub, error: insertError } = await supabase
    .from("submissions")
    .insert({
      kind: "problem",
      body,
      municipality: municipality ?? null,
      county: county ?? null,
      contact_email: contactEmail ?? null,
    })
    .select(SUBMISSION_COLUMNS)
    .single();
  if (insertError || !sub) {
    console.error("saveMatchSubmission insert failed", insertError?.message);
    return failed(RETRY);
  }

  // Only the first save links the conversation; a parallel click loses here.
  const { data: linked, error: linkError } = await supabase
    .from("conversations")
    .update({ submission_id: sub.id })
    .eq("id", conversationId)
    .is("submission_id", null)
    .select("submission_id");
  if (linkError) {
    console.error("saveMatchSubmission link failed", linkError.message);
    return failed(RETRY);
  }

  if (linked.length === 0) {
    // Authors cannot delete submissions, so the system removes the duplicate.
    await createAdminClient().from("submissions").delete().eq("id", sub.id);
    const { data: winner } = await supabase
      .from("conversations")
      .select("submission_id")
      .eq("id", conversationId)
      .maybeSingle();
    return winner?.submission_id ? existingSubmission(supabase, winner.submission_id, contactEmail) : failed(RETRY);
  }

  onSubmissionCreated(sub);
  return saved(sub);
}

/**
 * The conversation was saved before. „Wyślij mi na e-mail” after „Zapisz
 * wyniki” still has to store the address, which only the system may write.
 */
async function existingSubmission(
  supabase: Awaited<ReturnType<typeof ensureSession>>,
  submissionId: string,
  contactEmail: string | undefined,
): Promise<SaveMatchSubmissionResult> {
  const { data: sub, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("id", submissionId)
    .maybeSingle();
  if (error || !sub) return failed(RETRY);

  if (!contactEmail || sub.contact_email) return saved(sub);

  const { error: updateError } = await createAdminClient()
    .from("submissions")
    .update({ contact_email: contactEmail })
    .eq("id", sub.id);
  if (updateError) {
    console.error("saveMatchSubmission e-mail update failed", updateError.message);
    return failed(RETRY);
  }

  const updated = { ...sub, contact_email: contactEmail };
  await notify({
    type: "submission_received",
    recipientId: updated.author_id,
    submissionId: updated.id,
    title: `Przyjęliśmy zgłoszenie ${updated.case_number}`,
    link: trackingLink(updated),
    email: contactEmail,
  });
  return saved(updated);
}
