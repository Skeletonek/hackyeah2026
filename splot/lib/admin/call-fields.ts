import { z } from "zod";
import { slugify } from "@/lib/admin/library-fields";
import type { CallCriterion, CallSection } from "@/lib/ideas/application";
import { Constants } from "@/lib/supabase/database.types";

/** The grant call configurator form: status, dates, list rows and the zod schema. Shared by the form and its action. */

// ── Status ──────────────────────────────────────────────────────────────

export type CallStatus = "open" | "planned" | "closed";

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  open: "Trwa",
  planned: "Zaplanowany",
  closed: "Zakończony",
};

/** Never stored: a call is open between its two dates. */
export function callStatus(call: { opens_at: string; closes_at: string }, now = new Date()): CallStatus {
  if (now < new Date(call.opens_at)) return "planned";
  if (now > new Date(call.closes_at)) return "closed";
  return "open";
}

// ── Dates ───────────────────────────────────────────────────────────────
// ROPS picks days, not hours: a call opens at 00:00 and closes at 23:59:59
// Warsaw time, whatever time zone the server runs in.

const WARSAW_DAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" });
const WARSAW_WALL = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Warsaw",
  dateStyle: "short",
  timeStyle: "medium",
});

/** A timestamp as the day on a Warsaw calendar, „2026-10-31”: the value of `<input type="date">`. */
export function warsawDay(iso: string) {
  return WARSAW_DAY.format(new Date(iso));
}

function warsawInstant(day: string, time: string) {
  const asUtc = new Date(`${day}T${time}Z`);
  // The same moment read on a Warsaw clock, minus itself, is Warsaw's offset.
  const offset = new Date(`${WARSAW_WALL.format(asUtc).replace(" ", "T")}Z`).getTime() - asUtc.getTime();
  return new Date(asUtc.getTime() - offset).toISOString();
}

// ── List rows ───────────────────────────────────────────────────────────

export const SECTION_TYPES = ["text", "textarea", "number", "select"] as const satisfies readonly CallSection["type"][];

export const SECTION_TYPE_LABELS: Record<CallSection["type"], string> = {
  text: "Krótki tekst",
  textarea: "Długi tekst",
  number: "Kwota",
  select: "Lista odpowiedzi",
};

/** Only free text has a character limit to set. */
export function hasCharLimit(type: CallSection["type"]) {
  return type === "text" || type === "textarea";
}

/** What the form sends for one section: every value is still text. */
export type SectionRowInput = {
  key: string;
  label: string;
  type: CallSection["type"];
  hint: string;
  /** One answer per line. */
  options: string;
  max: string;
};

export type CriterionRowInput = { key: string; label: string };

const KEY_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const MAX_CHARS = 10_000;
const MAX_OPTIONS = 20;

function optionLines(text: string) {
  return [...new Set(text.split("\n").map((line) => line.trim()).filter(Boolean))];
}

/**
 * Gives every row its `key`. A saved key stays as it is, because applications
 * store their answers under it; a new row gets one from its label
 * („Opis problemu” → `opis_problemu`), numbered when the list already has it.
 */
function assignKeys<T extends { key: string; label: string }>(rows: T[], fallback: string): T[] {
  const used = new Set<string>();
  const kept = rows.map((row) => {
    if (!KEY_PATTERN.test(row.key) || used.has(row.key)) return false;
    used.add(row.key);
    return true;
  });

  return rows.map((row, index) => {
    if (kept[index]) return row;
    const base = slugify(row.label).replace(/-/g, "_").slice(0, 40).replace(/_+$/, "") || fallback;
    let key = base;
    for (let n = 2; used.has(key); n++) key = `${base}_${n}`;
    used.add(key);
    return { ...row, key };
  });
}

const rowKey = z.string().max(60).catch("");

const sectionRow = z
  .object({
    key: rowKey,
    label: z.string().trim().min(2, "Wpisz nazwę pola, co najmniej 2 znaki.").max(120, "Skróć nazwę pola do 120 znaków."),
    type: z.enum(SECTION_TYPES, "Wybierz rodzaj pola z listy."),
    hint: z.string().trim().max(300, "Skróć podpowiedź do 300 znaków."),
    options: z.string().max(5000, "Lista odpowiedzi jest za długa."),
    max: z.string().trim(),
  })
  .superRefine((row, ctx) => {
    if (row.type === "select") {
      const options = optionLines(row.options);
      if (options.length < 2) {
        ctx.addIssue({ code: "custom", path: ["options"], message: "Wpisz co najmniej 2 odpowiedzi, każdą w nowej linii." });
      } else if (options.length > MAX_OPTIONS) {
        ctx.addIssue({ code: "custom", path: ["options"], message: `Zostaw najwyżej ${MAX_OPTIONS} odpowiedzi.` });
      } else if (options.some((option) => option.length > 200)) {
        ctx.addIssue({ code: "custom", path: ["options"], message: "Skróć każdą odpowiedź do 200 znaków." });
      }
    }
    if (hasCharLimit(row.type) && row.max) {
      const max = Number(row.max);
      if (!/^\d+$/.test(row.max) || max < 1 || max > MAX_CHARS) {
        ctx.addIssue({ code: "custom", path: ["max"], message: `Wpisz liczbę od 1 do ${MAX_CHARS}.` });
      }
    }
  })
  .transform((row): CallSection => {
    const section: CallSection = { key: row.key, label: row.label, type: row.type };
    if (row.hint) section.hint = row.hint;
    if (row.type === "select") section.options = optionLines(row.options);
    if (hasCharLimit(row.type) && row.max) section.max = Number(row.max);
    return section;
  });

const criterionRow = z.object({
  key: rowKey,
  label: z.string().trim().min(2, "Wpisz treść kryterium, co najmniej 2 znaki.").max(300, "Skróć kryterium do 300 znaków."),
});

const day = (message: string) => z.iso.date(message);

export const callInput = z
  .object({
    id: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
    title: z.string().trim().min(3, "Wpisz nazwę naboru, co najmniej 3 znaki.").max(200, "Skróć nazwę do 200 znaków."),
    description: z
      .string()
      .trim()
      .max(2000, "Skróć opis do 2000 znaków.")
      .transform((value) => value || null),
    opens_at: day("Wybierz dzień, w którym nabór się zaczyna."),
    closes_at: day("Wybierz dzień, w którym nabór się kończy."),
    category: z
      .union([z.enum(Constants.public.Enums.challenge_category), z.literal("")], "Wybierz wyzwanie z listy.")
      .transform((value) => value || null),
    sections: z
      .array(sectionRow)
      .min(1, "Dodaj co najmniej jedno pole wniosku.")
      .max(30, "Zostaw najwyżej 30 pól wniosku."),
    criteria: z.array(criterionRow).max(20, "Zostaw najwyżej 20 kryteriów."),
  })
  .refine((data) => data.closes_at >= data.opens_at, {
    path: ["closes_at"],
    message: "Koniec naboru nie może być wcześniej niż początek.",
  })
  .transform((data) => ({
    ...data,
    opens_at: warsawInstant(data.opens_at, "00:00:00"),
    closes_at: warsawInstant(data.closes_at, "23:59:59"),
    sections: assignKeys(data.sections, "pole"),
    criteria: assignKeys<CallCriterion>(data.criteria, "kryterium"),
  }));

export type CallInput = z.output<typeof callInput>;

/** FormData → the shape `callInput` expects (the two lists travel as JSON in hidden fields). */
export function callFormValues(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const list = (name: string): unknown => {
    try {
      return JSON.parse(text(name));
    } catch {
      return [];
    }
  };
  return {
    id: text("id"),
    title: text("title"),
    description: text("description"),
    opens_at: text("opens_at"),
    closes_at: text("closes_at"),
    category: text("category"),
    sections: list("sections"),
    criteria: list("criteria"),
  };
}
