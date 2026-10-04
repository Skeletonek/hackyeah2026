import { z } from "zod";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { CANVAS_CELLS, parseCanvas, type CanvasSource } from "./canvas";
import { ideaSnapshot, type Idea } from "./card";

/**
 * Grant application („Wniosek”): the form a grant call defines in
 * `grant_calls.sections` and `criteria`, what is stored in
 * `grant_applications` and the prompts that fill and check it.
 */

export type GrantCall = Tables<"grant_calls">;

const sectionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "number", "select"]),
  hint: z.string().optional(),
  options: z.array(z.string().min(1)).optional(),
  max: z.number().int().positive().optional(),
});

const criterionSchema = z.object({ key: z.string().min(1), label: z.string().min(1) });

export type CallSection = z.infer<typeof sectionSchema>;
export type CallCriterion = z.infer<typeof criterionSchema>;

/** A jsonb list as typed items; an item that does not fit the shape is dropped. */
function parseList<T>(value: Json, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function parseSections(value: Json): CallSection[] {
  return parseList(value, sectionSchema);
}

export function parseCriteria(value: Json): CallCriterion[] {
  return parseList(value, criterionSchema);
}

/** A number is a whole amount; "" is a field still to fill in. */
export type ApplicationField = { value: string; source: CanvasSource };
export type ApplicationFields = Record<string, ApplicationField>;
export type CriterionCheck = { met: boolean; /** The assistant's remark; "" when it did not judge. */ note: string };
export type ApplicationCriteria = Record<string, CriterionCheck>;
export type ApplicationContent = { fields: ApplicationFields; criteria: ApplicationCriteria };

const fieldSchema = z.object({ value: z.string(), source: z.enum(["ai", "author"]) });
const checkSchema = z.object({ met: z.boolean(), note: z.string() });

function parseRecord<T>(value: Json, schema: z.ZodType<T>): Record<string, T> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const record: Record<string, T> = {};
  for (const [key, entry] of Object.entries(value)) {
    const parsed = schema.safeParse(entry);
    if (parsed.success) record[key] = parsed.data;
  }
  return record;
}

export function parseApplication(application: Pick<Tables<"grant_applications">, "fields" | "criteria">): ApplicationContent {
  return {
    fields: parseRecord(application.fields, fieldSchema),
    criteria: parseRecord(application.criteria, checkSchema),
  };
}

/** `{}` in both is an application nobody prepared yet: the first open fills it. */
export function isApplicationEmpty(content: ApplicationContent) {
  return Object.keys(content.fields).length === 0 && Object.keys(content.criteria).length === 0;
}

const DEFAULT_MAX: Record<CallSection["type"], number> = { text: 200, textarea: 2000, number: 12, select: 200 };
const NOTE_MAX = 300;

export function sectionMax(section: CallSection) {
  return section.max ?? DEFAULT_MAX[section.type];
}

/** The applicant and every amount: only the author knows them. */
const AUTHOR_ONLY_KEYS = new Set(["applicant", "amount", "budget"]);

/** A section AI never fills in. */
export function isAuthorOnly(section: CallSection) {
  return section.type === "number" || AUTHOR_ONLY_KEYS.has(section.key);
}

// ── What the author sends ───────────────────────────────────────────────

export type ApplicationInput = { fields: Record<string, string>; criteria: Record<string, boolean> };

export const applicationInputSchema = z.object({
  fields: z.record(z.string(), z.string().max(10_000)),
  criteria: z.record(z.string(), z.boolean()),
});

/**
 * Checks the author's values against the call's sections. A draft only has
 * to fit the type and the length; `complete` also asks for every field.
 */
export function validateFields(sections: CallSection[], input: Record<string, string>, mode: "draft" | "complete") {
  const values: Record<string, string> = {};
  const fieldErrors: Record<string, string[]> = {};

  for (const section of sections) {
    const value = (input[section.key] ?? "").trim();
    values[section.key] = value;
    const max = sectionMax(section);

    if (!value) {
      if (mode === "complete") fieldErrors[section.key] = ["Uzupełnij to pole."];
    } else if (section.type === "number") {
      if (!/^\d{1,12}$/.test(value)) fieldErrors[section.key] = ["Wpisz kwotę samymi cyframi, np. 25000."];
    } else if (section.type === "select") {
      if (!section.options?.includes(value)) fieldErrors[section.key] = ["Wybierz jedną z odpowiedzi z listy."];
    } else if (value.length > max) {
      fieldErrors[section.key] = [`Skróć tekst do ${max} znaków.`];
    }
  }

  return { values, fieldErrors, ok: Object.keys(fieldErrors).length === 0 };
}

/** The saved fields: a value the author changed becomes theirs, an untouched AI draft stays `ai`. */
export function mergeFields(sections: CallSection[], stored: ApplicationFields, values: Record<string, string>) {
  const fields: ApplicationFields = {};
  for (const { key } of sections) {
    const previous = stored[key];
    const value = values[key] ?? "";
    fields[key] = previous && previous.value === value ? previous : { value, source: "author" };
  }
  return fields;
}

/** The author's ticks, with the assistant's notes kept beside them. */
export function mergeCriteria(criteria: CallCriterion[], stored: ApplicationCriteria, ticks: Record<string, boolean>) {
  const merged: ApplicationCriteria = {};
  for (const { key } of criteria) {
    merged[key] = { met: ticks[key] ?? stored[key]?.met ?? false, note: stored[key]?.note ?? "" };
  }
  return merged;
}

/** `submissions.body` check: 3–5000 characters. */
const MAX_BODY_LENGTH = 5000;

/**
 * `submissions.body` of a sent application: the form as plain text at the
 * moment of sending.
 */
export function renderApplication(
  call: Pick<GrantCall, "title">,
  idea: Pick<Idea, "title">,
  sections: CallSection[],
  criteria: CallCriterion[],
  fields: ApplicationFields,
) {
  const body = [
    `Wniosek w naborze: ${call.title}`,
    `Pomysł: ${idea.title}`,
    ...sections.filter(({ key }) => fields[key]?.value).map(({ key, label }) => `${label}:\n${fields[key].value}`),
    criteria.length > 0 &&
      `Kryteria potwierdzone przez autora:\n${criteria.map(({ label }) => `- ${label}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return body.length > MAX_BODY_LENGTH ? `${body.slice(0, MAX_BODY_LENGTH - 1)}…` : body;
}

// ── AI ──────────────────────────────────────────────────────────────────

function criteriaShape(criteria: CallCriterion[]) {
  return z.object(
    Object.fromEntries(
      criteria.map(({ key, label }) => [
        key,
        z.object({
          met: z.boolean().describe(`Czy wniosek spełnia kryterium: ${label}`),
          note: z.string().describe("Jedno krótkie zdanie: dlaczego tak albo co dopisać."),
        }),
      ]),
    ),
  );
}

/** The fields AI may draft: a text or null for each, built from the call's sections. */
function fieldsShape(sections: CallSection[]) {
  return z.object(
    Object.fromEntries(
      sections
        .filter((section) => !isAuthorOnly(section))
        .map((section) => {
          const about = [
            `${section.label}.`,
            section.hint,
            section.type === "select"
              ? `Jedna z odpowiedzi: ${section.options?.join("; ")}.`
              : `Najwyżej ${sectionMax(section)} znaków.`,
            "Null, gdy fiszka tego nie mówi.",
          ];
          return [section.key, z.string().nullable().describe(about.filter(Boolean).join(" "))];
        }),
    ),
  );
}

/** What the model returns on the first open; the shape follows this call's definition. */
export function applicationDraftSchema(sections: CallSection[], criteria: CallCriterion[]) {
  return z.object({ fields: fieldsShape(sections), criteria: criteriaShape(criteria) });
}

export function applicationCheckSchema(criteria: CallCriterion[]) {
  return z.object({ criteria: criteriaShape(criteria) });
}

type ChecksDraft = Record<string, { met: boolean; note: string } | undefined>;

/** The model's draft as stored fields; null, or an answer off the list, stays empty. */
export function fieldsFromDraft(sections: CallSection[], draft: Record<string, string | null | undefined>) {
  const fields: ApplicationFields = {};
  for (const section of sections) {
    if (isAuthorOnly(section)) {
      fields[section.key] = { value: "", source: "author" };
      continue;
    }
    const text = (draft[section.key] ?? "").trim();
    const value = section.type === "select" && !section.options?.includes(text) ? "" : text.slice(0, sectionMax(section));
    fields[section.key] = { value, source: "ai" };
  }
  return fields;
}

export function criteriaFromDraft(criteria: CallCriterion[], draft: ChecksDraft) {
  const checks: ApplicationCriteria = {};
  for (const { key } of criteria) {
    checks[key] = { met: draft[key]?.met ?? false, note: (draft[key]?.note ?? "").trim().slice(0, NOTE_MAX) };
  }
  return checks;
}

const JUDGE_RULES = `Ocena kryteriów:
- „met” ustaw na true tylko wtedy, gdy treść wniosku wyraźnie to pokazuje. W razie wątpliwości false.
- „note” to jedno krótkie zdanie prostym językiem, zwrócone do autora: co przekonuje albo co dopisać. Bez żargonu.
- Kryterium o budżecie albo kwocie oceniaj tylko na podstawie tego, co wpisał autor. Puste pole to false.`;

export const APPLICATION_DRAFT_SYSTEM = `Przygotowujesz wniosek grantowy do naboru ROPS Kraków na podstawie fiszki pomysłu i Kanwy Innowacji Społecznych. Autorem jest mieszkaniec, organizacja albo urzędnik z Małopolski.

Pisz po polsku, prostym językiem, w pierwszej osobie, tak jak autor mógłby to napisać sam. Pełne zdania, bez nagłówków, list i pogrubień.

Pola wniosku:
- Korzystaj tylko z tego, co jest w fiszce i kanwie albo z nich bezpośrednio wynika.
- Jeśli nie ma podstaw do wypełnienia pola, zwróć null. Lepsze puste pole niż zgadywanie.
- Nie wymyślaj kwot, liczb, dat, nazw partnerów ani instytucji.
- Trzymaj się limitu znaków pola.

${JUDGE_RULES}`;

export const APPLICATION_CHECK_SYSTEM = `Sprawdzasz wniosek grantowy do naboru ROPS Kraków pod kątem kryteriów naboru. Autorem jest mieszkaniec, organizacja albo urzędnik z Małopolski. Niczego we wniosku nie zmieniasz.

${JUDGE_RULES}`;

function formatCall(call: Pick<GrantCall, "title" | "description">, criteria: CallCriterion[]) {
  return [
    `Nabór: ${call.title}`,
    call.description,
    criteria.length > 0 && `Kryteria naboru:\n${criteria.map(({ key, label }) => `- ${key}: ${label}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatCanvas(idea: Idea) {
  const canvas = parseCanvas(idea.canvas);
  const cells = CANVAS_CELLS.flatMap((cell) =>
    cell.kind === "canvas" && canvas[cell.key]?.text ? [`${cell.title}: ${canvas[cell.key]!.text}`] : [],
  );
  return cells.length > 0 ? `Kanwa Innowacji Społecznych:\n${cells.join("\n")}` : "Kanwa Innowacji Społecznych: jeszcze pusta.";
}

export function applicationDraftPrompt(idea: Idea, call: GrantCall, criteria: CallCriterion[]) {
  return [`Fiszka pomysłu:\n\n${ideaSnapshot(idea)}`, formatCanvas(idea), formatCall(call, criteria)].join("\n\n");
}

export function applicationCheckPrompt(
  call: GrantCall,
  sections: CallSection[],
  criteria: CallCriterion[],
  fields: ApplicationFields,
) {
  const form = sections.map(({ key, label }) => `${label}:\n${fields[key]?.value || "(puste)"}`);
  return [formatCall(call, criteria), `Wniosek:\n\n${form.join("\n\n")}`].join("\n\n");
}
