"use server";

import { redirect } from "next/navigation";
import { ensureSession } from "@/lib/auth";
import {
  callParam,
  ideaStepHref,
  isUuid,
  type IdeaCardValues,
  type IdeaField,
  type IdeaFormStep,
} from "@/lib/ideas/card";
import { parseIdeaStep, readIdeaStep } from "@/lib/ideas/schema";
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
