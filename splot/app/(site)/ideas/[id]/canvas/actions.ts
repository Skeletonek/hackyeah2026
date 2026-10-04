"use server";

import { generateObject, generateText } from "ai";
import { z } from "zod";
import { TEXT_MODEL } from "@/lib/ai/models";
import { getCurrentUser } from "@/lib/auth";
import {
  CANVAS_DRAFT_SYSTEM,
  CANVAS_FIELDS,
  CANVAS_HINT_SYSTEM,
  CANVAS_TEXT_MAX,
  canvasDraftPrompt,
  canvasDraftSchema,
  canvasFromDraft,
  canvasHintPrompt,
  isCanvasEmpty,
  parseCanvas,
  type Canvas,
  type CanvasDraft,
} from "@/lib/ideas/canvas";
import { type Idea } from "@/lib/ideas/card";
import { getIdea, listOpenGrantCalls } from "@/lib/ideas/queries";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CanvasResult = { ok: true; canvas: Canvas } | { error: string; fieldErrors?: { text?: string[] } };
export type CanvasHintResult = { ok: true; text: string } | { error: string };

const NOT_FOUND = "Nie znaleźliśmy tej fiszki. Kanwę zmienia tylko autor pomysłu.";
const SAVE_FAILED = "Nie udało się zapisać pola. Spróbuj jeszcze raz za chwilę.";

/** The card, only for its author: RLS also shows admins other people's cards. */
async function getOwnIdea(ideaId: string): Promise<Idea | null> {
  const [idea, user] = await Promise.all([getIdea(ideaId), getCurrentUser()]);
  return idea && user && idea.user_id === user.id ? idea : null;
}

async function saveCanvas(ideaId: string, canvas: Canvas) {
  // RLS: only the owner's card is updated.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .update({ canvas: canvas as Json })
    .eq("id", ideaId)
    .select("id");
  if (error) console.error("saveCanvas failed", error.message);
  return !error && data.length > 0;
}

/**
 * First open of the canvas: one model call drafts the seven cells from the
 * idea card and the open grant calls. A cell the card says nothing about
 * stays empty. A canvas that already has cells is returned as it is.
 */
export async function fillCanvas(ideaId: string): Promise<CanvasResult> {
  const idea = await getOwnIdea(ideaId);
  if (!idea) return { error: NOT_FOUND };

  const existing = parseCanvas(idea.canvas);
  if (!isCanvasEmpty(existing)) return { ok: true, canvas: existing };

  let draft: CanvasDraft;
  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: canvasDraftSchema,
      system: CANVAS_DRAFT_SYSTEM,
      prompt: canvasDraftPrompt(idea, await listOpenGrantCalls()),
    });
    draft = object as CanvasDraft;
  } catch (error) {
    console.error("fillCanvas failed", ideaId, error);
    return { error: "Nie udało się przygotować propozycji. Pola możesz wypełnić samodzielnie." };
  }

  const canvas = canvasFromDraft(draft);
  if (!(await saveCanvas(ideaId, canvas))) return { error: SAVE_FAILED };
  return { ok: true, canvas };
}

const fieldSchema = z.object({
  field: z.enum(CANVAS_FIELDS),
  text: z.string().trim().max(CANVAS_TEXT_MAX, `Skróć tekst do ${CANVAS_TEXT_MAX} znaków.`),
  source: z.enum(["ai", "author"]),
});

/**
 * Saves one cell. The author's own text is `author`; an AI hint put in with
 * „Wstaw” stays `ai` until the author edits it.
 */
export async function saveCanvasField(ideaId: string, input: z.input<typeof fieldSchema>): Promise<CanvasResult> {
  const parsed = fieldSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Popraw tekst pola.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { field, text, source } = parsed.data;

  const idea = await getOwnIdea(ideaId);
  if (!idea) return { error: NOT_FOUND };

  const canvas: Canvas = { ...parseCanvas(idea.canvas), [field]: { text, source } };
  if (!(await saveCanvas(ideaId, canvas))) return { error: SAVE_FAILED };
  return { ok: true, canvas };
}

/** „Podpowiedz mi”: a one-shot suggestion for one empty cell. Nothing is saved. */
export async function suggestCanvasField(ideaId: string, field: unknown): Promise<CanvasHintResult> {
  const parsed = fieldSchema.shape.field.safeParse(field);
  const idea = await getOwnIdea(ideaId);
  if (!parsed.success || !idea) return { error: NOT_FOUND };

  try {
    const { text } = await generateText({
      model: TEXT_MODEL,
      system: CANVAS_HINT_SYSTEM,
      prompt: canvasHintPrompt(idea, parseCanvas(idea.canvas), parsed.data, await listOpenGrantCalls()),
    });
    const hint = text.trim().slice(0, CANVAS_TEXT_MAX);
    if (hint) return { ok: true, text: hint };
  } catch (error) {
    console.error("suggestCanvasField failed", ideaId, parsed.data, error);
  }
  return { error: "Nie udało się przygotować podpowiedzi. Spróbuj jeszcze raz za chwilę." };
}
