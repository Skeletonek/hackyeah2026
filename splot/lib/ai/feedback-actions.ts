"use server";

import { z } from "zod";
import { ensureSession } from "@/lib/auth";

const feedbackSchema = z.object({
  targetType: z.string().trim().min(1).max(64),
  targetId: z.string().trim().min(1).max(200),
  rating: z.union([z.literal(-1), z.literal(1)]),
  comment: z
    .string()
    .trim()
    .max(2000, "Skróć opis do 2000 znaków.")
    .optional()
    .transform((value) => value || null),
});

export type AiFeedbackInput = z.input<typeof feedbackSchema>;

export type AiFeedbackResult =
  | { ok: true }
  | { error: string; fieldErrors?: Partial<Record<keyof AiFeedbackInput, string[]>> };

/** Stores 👍/👎 or an error report for one AI hint. Visitors without an account get an anonymous session. */
export async function submitAiFeedback(input: AiFeedbackInput): Promise<AiFeedbackResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Sprawdź wpisany tekst i spróbuj ponownie.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { targetType, targetId, rating, comment } = parsed.data;
  const supabase = await ensureSession();
  const { error } = await supabase
    .from("ai_feedback")
    .insert({ target_type: targetType, target_id: targetId, rating, comment });

  if (error) {
    console.error("submitAiFeedback", error);
    return { error: "Nie udało się zapisać oceny. Spróbuj ponownie." };
  }
  return { ok: true };
}
