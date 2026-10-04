"use server";

import { redirect } from "next/navigation";
import { ensureSession, getCurrentUser } from "@/lib/auth";
import {
  callParam,
  ideaSnapshot,
  ideaStepHref,
  isUuid,
  type IdeaCardValues,
  type IdeaField,
  type IdeaFormStep,
} from "@/lib/ideas/card";
import { getIdeaSubmission } from "@/lib/ideas/queries";
import { linkIdeaConversation } from "@/lib/ideas/conversation";
import { parseIdeaStep, readIdeaStep } from "@/lib/ideas/schema";
import { onSubmissionCreated, submissionHref } from "@/lib/submissions/on-created";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type IdeaStepState = {
  status: "idle" | "saved" | "error";
  error?: string;
  fieldErrors?: Partial<Record<IdeaField, string[]>>;
  /** What the person sent, so the form keeps it after an error or „Zapisz szkic”. */
  values?: Partial<IdeaCardValues>;
  /** Changes with every save, so the confirmation is announced again. */
  savedAt?: number;
};

const RETRY = "Nie udało się zapisać fiszki. Spróbuj jeszcze raz za chwilę.";

/**
 * Saves one step of the idea card wizard. The submit button says what comes
 * next: „Dalej” (`next`) checks the required fields and opens the next step,
 * „Wstecz” (`back`) and „Zapisz szkic” (`draft`) save what is there. Without
 * an `id` it is the first save: it starts a session (anonymous if needed) and
 * creates the card.
 */
export async function saveIdeaStep(_previous: IdeaStepState, formData: FormData): Promise<IdeaStepState> {
  const step = Number(formData.get("step"));
  if (step !== 1 && step !== 2 && step !== 3) return { status: "error", error: RETRY };
  const formStep: IdeaFormStep = step;

  const intent = formData.get("intent");
  const call = callParam(formData.get("call"));
  const id = formData.get("id");
  const values = readIdeaStep(formStep, formData);

  const parsed = parseIdeaStep(formStep, intent === "next" ? "complete" : "draft", values);
  if (!parsed.ok) {
    return { status: "error", error: "Popraw zaznaczone pola.", fieldErrors: parsed.fieldErrors, values };
  }
  const data = parsed.data;

  let ideaId: string;
  if (isUuid(id)) {
    // RLS: only the owner's card is updated.
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from("ideas").update(data).eq("id", id).select("id");
    if (error) {
      console.error("saveIdeaStep update failed", error.message);
      return { status: "error", error: RETRY, values };
    }
    if (updated.length === 0) {
      return {
        status: "error",
        error: "Nie znaleźliśmy tej fiszki. Szkic jest zapisany w przeglądarce, w której powstał.",
        values,
      };
    }
    ideaId = id;
  } else {
    if (!("title" in data)) return { status: "error", error: RETRY, values };

    const supabase = await ensureSession();
    const { data: created, error } = await supabase.from("ideas").insert(data).select("id").single();
    if (error || !created) {
      console.error("saveIdeaStep insert failed", error?.message);
      return { status: "error", error: RETRY, values };
    }
    ideaId = created.id;
    // A new draft gets its own address, so a reload opens it again.
    if (intent !== "next") redirect(`${ideaStepHref(ideaId, 1, call)}&saved=1`);
  }

  if (intent === "next") redirect(ideaStepHref(ideaId, (formStep + 1) as 2 | 3 | 4, call));
  if (intent === "back" && formStep > 1) redirect(ideaStepHref(ideaId, (formStep - 1) as 1 | 2, call));
  return { status: "saved", values, savedAt: Date.now() };
}

/**
 * Links the idea assistant's conversation to the card on its first message,
 * so a resumed draft restores the same chat. Owners only, via RLS.
 */
export async function setIdeaConversation(ideaId: string, conversationId: string): Promise<void> {
  if (!isUuid(ideaId) || !isUuid(conversationId)) throw new Error("invalid id");

  const supabase = await ensureSession();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("session unavailable");
  await linkIdeaConversation(supabase, data.claims.sub, ideaId, conversationId);
}

/**
 * „Wyślij do ROPS po radę”: turns the idea card into a submission of kind
 * idea and opens it. A card has one advice submission, so a second send opens
 * the first. The body is a snapshot; the card stays editable.
 * `formData` is there when a form calls the bound action; it carries `call`.
 */
export async function sendIdeaToRops(ideaId: string, formData?: FormData): Promise<never> {
  if (!isUuid(ideaId)) redirect("/ideas/new");
  const failed = `${ideaStepHref(ideaId, 4, callParam(formData?.get("call")))}&send=failed`;

  const supabase = await ensureSession();
  const user = await getCurrentUser();
  if (!user) redirect(failed);

  const { data: idea, error: loadError } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", ideaId)
    // RLS also shows admins other people's cards; only the author sends one.
    .eq("user_id", user.id)
    .maybeSingle();
  if (loadError) console.error("sendIdeaToRops load failed", loadError.message);
  // No card: the page says it was not found.
  if (!idea) redirect(ideaStepHref(ideaId, 4));

  const existing = await getIdeaSubmission(supabase, idea.id);
  if (existing) redirect(submissionHref(existing, user.isAnonymous));

  const { data: sub, error: insertError } = await supabase
    .from("submissions")
    .insert({ kind: "idea", idea_id: idea.id, body: ideaSnapshot(idea) })
    .select("id, case_number, tracking_token, author_id, contact_email")
    .single();
  if (insertError || !sub) {
    console.error("sendIdeaToRops insert failed", insertError?.message);
    redirect(failed);
  }

  // A parallel click made its own submission; the oldest one stays.
  const first = await getIdeaSubmission(supabase, idea.id);
  if (first && first.id !== sub.id) {
    // Authors cannot delete submissions, so the system removes the duplicate.
    await createAdminClient().from("submissions").delete().eq("id", sub.id);
    redirect(submissionHref(first, user.isAnonymous));
  }

  if (idea.conversation_id) {
    // ROPS reads the idea assistant's conversation beside the submission.
    const { error: linkError } = await supabase
      .from("conversations")
      .update({ submission_id: sub.id })
      .eq("id", idea.conversation_id)
      .is("submission_id", null);
    if (linkError) console.error("sendIdeaToRops link failed", linkError.message);
  }

  onSubmissionCreated(sub);
  redirect(submissionHref(sub, user.isAnonymous));
}
