import { z } from "zod";
import { TARGET_GROUP_LABELS } from "@/lib/labels";
import type { Json } from "@/lib/supabase/database.types";
import { ideaSnapshot, type Idea, type IdeaFormStep } from "./card";

/**
 * Social Innovation Canvas („Kanwa Innowacji Społecznych”): its ten cells,
 * what is stored in `ideas.canvas` and the prompts that fill it.
 */

/** The cells kept in `ideas.canvas`; the other three are read from the idea card. */
export const CANVAS_FIELDS = [
  "resources",
  "change",
  "partners",
  "outreach",
  "costs",
  "indicators",
  "funding",
] as const;

export type CanvasField = (typeof CANVAS_FIELDS)[number];
export type CanvasSource = "ai" | "author";

/** An empty `text` is a cell still to fill in („Do uzupełnienia”). */
export type CanvasEntry = { text: string; source: CanvasSource };
export type Canvas = Partial<Record<CanvasField, CanvasEntry>>;

export const CANVAS_TEXT_MAX = 1000;

export type CardCellKey = "problem" | "solution" | "audience";

export type CanvasCell = {
  title: string;
  question: string;
  /** Place on the five-column sheet (wide screens and print). */
  column: string;
  row: string;
} & (
  | { kind: "card"; key: CardCellKey; /** The wizard step that edits it. */ step: IdeaFormStep }
  | { kind: "canvas"; key: CanvasField }
);

/** In reading order, which is also the order on a narrow screen. */
export const CANVAS_CELLS: readonly CanvasCell[] = [
  { kind: "card", key: "problem", step: 1, title: "Problem", question: "Jaki problem rozwiązujesz?", column: "1", row: "1 / span 2" },
  { kind: "card", key: "solution", step: 1, title: "Rozwiązanie", question: "Co dokładnie robisz?", column: "2", row: "1" },
  { kind: "canvas", key: "resources", title: "Zasoby", question: "Czego potrzebujesz?", column: "2", row: "2" },
  { kind: "canvas", key: "change", title: "Zmiana", question: "Co się zmieni dla ludzi?", column: "3", row: "1 / span 2" },
  { kind: "canvas", key: "partners", title: "Partnerzy", question: "Kto Ci pomoże?", column: "4", row: "1" },
  { kind: "canvas", key: "outreach", title: "Jak dotrzesz do ludzi", question: "Skąd ludzie się o tym dowiedzą?", column: "4", row: "2" },
  { kind: "card", key: "audience", step: 2, title: "Odbiorcy", question: "Dla kogo to jest?", column: "5", row: "1 / span 2" },
  { kind: "canvas", key: "costs", title: "Koszty", question: "Ile to kosztuje rocznie?", column: "1 / span 2", row: "3" },
  { kind: "canvas", key: "indicators", title: "Wskaźniki sukcesu", question: "Po czym poznasz, że działa?", column: "3", row: "3" },
  { kind: "canvas", key: "funding", title: "Finansowanie", question: "Skąd pieniądze?", column: "4 / span 2", row: "3" },
];

const CANVAS_FIELD_CELLS = Object.fromEntries(
  CANVAS_CELLS.filter((cell) => cell.kind === "canvas").map((cell) => [cell.key, cell]),
) as Record<CanvasField, CanvasCell>;

const entrySchema = z.object({
  text: z.string().max(CANVAS_TEXT_MAX),
  source: z.enum(["ai", "author"]),
});

/** `ideas.canvas` as typed cells; anything that does not fit the shape is dropped. */
export function parseCanvas(value: Json): Canvas {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const canvas: Canvas = {};
  for (const field of CANVAS_FIELDS) {
    const entry = entrySchema.safeParse(value[field]);
    if (entry.success) canvas[field] = entry.data;
  }
  return canvas;
}

/** `{}` is a canvas nobody opened yet: the first open fills it. */
export function isCanvasEmpty(canvas: Canvas) {
  return Object.keys(canvas).length === 0;
}

/** The three cells read live from the idea card. */
export function cardCellTexts(idea: Idea): Record<CardCellKey, string> {
  const audience = [
    idea.target_groups.map((group) => TARGET_GROUP_LABELS[group]).join(", "),
    idea.audience,
    idea.location && `Gdzie: ${idea.location}`,
    idea.reach && `W pierwszym roku: ${idea.reach}`,
  ];
  return {
    problem: idea.problem?.trim() ?? "",
    solution: idea.solution?.trim() ?? "",
    audience: audience.filter((line) => line?.trim()).join("\n"),
  };
}

// ── AI ──────────────────────────────────────────────────────────────────

/** What the model returns on the first open: a text or null for every cell. */
export const canvasDraftSchema = z.object(
  Object.fromEntries(
    CANVAS_FIELDS.map((field) => [
      field,
      z
        .string()
        .nullable()
        .describe(`${CANVAS_FIELD_CELLS[field].title}: ${CANVAS_FIELD_CELLS[field].question} Null, gdy fiszka tego nie mówi.`),
    ]),
  ) as Record<CanvasField, z.ZodNullable<z.ZodString>>,
);

export type CanvasDraft = z.infer<typeof canvasDraftSchema>;

/** The model's draft as stored cells; null becomes an empty cell, never a guess. */
export function canvasFromDraft(draft: CanvasDraft): Canvas {
  const canvas: Canvas = {};
  for (const field of CANVAS_FIELDS) {
    canvas[field] = { text: (draft[field] ?? "").trim().slice(0, CANVAS_TEXT_MAX), source: "ai" };
  }
  return canvas;
}

export type CanvasGrantCall = { title: string; description: string | null; closes_at: string };

const STYLE = `Pisz po polsku, prostym językiem, tak jak autor mógłby to napisać sam: krótkie zdania albo wyliczenie po przecinku, najwyżej 3 zdania na pole. Bez żargonu, nagłówków, list i pogrubień.`;

export const CANVAS_DRAFT_SYSTEM = `Wypełniasz Kanwę Innowacji Społecznych ROPS Kraków na podstawie fiszki pomysłu. Autorem jest mieszkaniec, organizacja albo urzędnik z Małopolski.

${STYLE}

Zasady:
- Korzystaj tylko z tego, co jest w fiszce albo z niej bezpośrednio wynika.
- Jeśli fiszka nie daje podstaw do wypełnienia pola, zwróć null. Lepsze puste pole niż zgadywanie.
- Nie wymyślaj kwot, liczb, dat, nazw partnerów ani instytucji.
- W polu „Finansowanie” możesz wskazać nabór tylko z listy trwających naborów i tylko wtedy, gdy pasuje do pomysłu.
- Nie powtarzaj treści pól „Problem”, „Rozwiązanie” i „Odbiorcy”: autor ma je na kanwie z fiszki.`;

export const CANVAS_HINT_SYSTEM = `Pomagasz autorowi pomysłu uzupełnić jedno pole Kanwy Innowacji Społecznych ROPS Kraków. Autor sam poprosił o podpowiedź, więc zaproponuj treść tego pola dopasowaną do jego fiszki.

${STYLE}

Zasady:
- Zwróć tylko treść pola, bez wstępu i bez nazwy pola.
- To propozycja do sprawdzenia: gdy czegoś nie wiesz, napisz, co autor powinien ustalić albo policzyć, zamiast podawać to jako fakt.
- Nie wymyślaj kwot, nazw partnerów ani instytucji, których nie ma w fiszce. Nabór wskaż tylko z listy trwających naborów.`;

function formatCalls(calls: CanvasGrantCall[]) {
  if (calls.length === 0) return "Trwające nabory ROPS: brak.";
  return [
    "Trwające nabory ROPS:",
    ...calls.map((call) =>
      [`- ${call.title} (do ${call.closes_at.slice(0, 10)})`, call.description].filter(Boolean).join(": "),
    ),
  ].join("\n");
}

export function canvasDraftPrompt(idea: Idea, calls: CanvasGrantCall[]) {
  return `Fiszka pomysłu:\n\n${ideaSnapshot(idea)}\n\n${formatCalls(calls)}`;
}

export function canvasHintPrompt(idea: Idea, canvas: Canvas, field: CanvasField, calls: CanvasGrantCall[]) {
  const filled = CANVAS_FIELDS.filter((other) => other !== field && canvas[other]?.text).map(
    (other) => `${CANVAS_FIELD_CELLS[other].title}: ${canvas[other]!.text}`,
  );
  const cell = CANVAS_FIELD_CELLS[field];

  return [
    `Fiszka pomysłu:\n\n${ideaSnapshot(idea)}`,
    filled.length > 0 && `Wypełnione pola kanwy:\n${filled.join("\n")}`,
    formatCalls(calls),
    `Pole do uzupełnienia: „${cell.title}” (${cell.question})`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
