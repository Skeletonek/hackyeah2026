import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";
import { IDEA_ASSETS, IDEA_STAGES, type IdeaCardValues, type IdeaField, type IdeaFormStep } from "./card";

/**
 * Validation of the wizard's steps. Field names are the `ideas` columns, so
 * parsed data goes straight to the table. „Zapisz szkic” and „Wstecz” use the
 * draft schemas (length limits only); „Dalej” also asks for the required fields.
 */

/** The same limits as the checks on `public.ideas`. */
export const IDEA_LIMITS = {
  title: 120,
  solution: 2000,
  problem: 2000,
  audience: 500,
  location: 120,
  reach: 120,
} as const;

const tooLong = (max: number) => `Skróć tekst do ${max} znaków.`;

/** An empty field is stored as null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, tooLong(max))
    .transform((value) => value || null);

const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max, tooLong(max));

const draft = {
  1: z.object({
    // A draft needs a name: it is how the author finds it later.
    title: requiredText(IDEA_LIMITS.title, "Wpisz nazwę pomysłu, np. „Sąsiedzka wypożyczalnia sprzętu”."),
    solution: optionalText(IDEA_LIMITS.solution),
    problem: optionalText(IDEA_LIMITS.problem),
  }),
  2: z.object({
    target_groups: z.array(z.enum(Constants.public.Enums.target_group)),
    audience: optionalText(IDEA_LIMITS.audience),
    location: optionalText(IDEA_LIMITS.location),
    reach: optionalText(IDEA_LIMITS.reach),
  }),
  3: z.object({
    // No radio chosen arrives as "".
    stage: z.preprocess((value) => value || null, z.enum(IDEA_STAGES).nullable()),
    assets: z.array(z.enum(IDEA_ASSETS)),
  }),
};

const complete = {
  1: draft[1].extend({
    solution: requiredText(IDEA_LIMITS.solution, "Opisz w 2–3 zdaniach, na czym polega pomysł."),
    problem: requiredText(IDEA_LIMITS.problem, "Napisz, jaki problem rozwiązuje pomysł."),
  }),
  2: draft[2].extend({
    target_groups: draft[2].shape.target_groups.min(1, "Zaznacz co najmniej jedną grupę."),
    location: requiredText(IDEA_LIMITS.location, "Wpisz miejscowość albo gminę, np. „Gmina Limanowa”."),
  }),
  3: draft[3].extend({
    stage: z.enum(IDEA_STAGES, "Wybierz etap, na którym jest pomysł."),
  }),
};

/** The fields of one step as the browser sent them; also what the form shows again after an error. */
export function readIdeaStep(step: IdeaFormStep, formData: FormData): Partial<IdeaCardValues> {
  const text = (name: string) => String(formData.get(name) ?? "");
  const list = (name: string) => formData.getAll(name).map(String);

  switch (step) {
    case 1:
      return { title: text("title"), solution: text("solution"), problem: text("problem") };
    case 2:
      return {
        target_groups: list("target_groups") as IdeaCardValues["target_groups"],
        audience: text("audience"),
        location: text("location"),
        reach: text("reach"),
      };
    case 3:
      return {
        stage: text("stage") as IdeaCardValues["stage"],
        assets: list("assets") as IdeaCardValues["assets"],
      };
  }
}

/** One step's columns, ready for `ideas`. */
export type IdeaStepData = z.output<(typeof draft)[IdeaFormStep]>;

export type IdeaStepResult =
  | { ok: true; data: IdeaStepData }
  | { ok: false; fieldErrors: Partial<Record<IdeaField, string[]>> };

export function parseIdeaStep(
  step: IdeaFormStep,
  mode: "draft" | "complete",
  values: Partial<IdeaCardValues>,
): IdeaStepResult {
  const schema: z.ZodType<IdeaStepData> = (mode === "complete" ? complete : draft)[step];
  const parsed = schema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
}
