import { z } from "zod";

export const SHOW_MATCHES = "showMatches";
export const MAX_MATCHES = 5;

export const showMatchesInput = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(200).describe("Slug innowacji z wyników searchInnovations."),
        why: z
          .string()
          .trim()
          .min(1)
          .max(400)
          .describe("„Dlaczego to pasuje”: 1–2 proste zdania po polsku, odniesione do opisanego problemu."),
        quote: z
          .string()
          .trim()
          .min(15)
          .max(300)
          .describe(
            "Krótki fragment pola solution albo problem tej innowacji (a gdy oba są puste, pola lead), skopiowany znak po znaku, który potwierdza uzasadnienie.",
          ),
      }),
    )
    .max(MAX_MATCHES)
    .describe("Najlepsze dopasowania, od najlepszego. Puste, gdy noMatch = true."),
  noMatch: z.boolean().describe("true, gdy żadna innowacja nie pasuje do problemu."),
});

export type ShowMatchesInput = z.infer<typeof showMatchesInput>;

/**
 * The results screen renders the tool input only when `shown` is true; a
 * rejected call is followed by a corrected one in the same turn.
 */
export type ShowMatchesOutput = { shown: true } | { shown: false; problems: string[] };

/** The text a quote must come from. */
export type MatchSource = {
  slug: string;
  solution: string | null;
  problem: string | null;
  lead: string | null;
};

/** Same text regardless of line breaks, letter case and quote or dash style. */
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[„”“‟"«»]/g, '"')
    .replace(/[‘’‚']/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Keeps the model honest: every slug is a real innovation and every quote is
 * in its source text (`lead` covers innovations without a full description). Returns the problems to hand back to the model, in Polish.
 */
export function checkMatches(input: ShowMatchesInput, sources: MatchSource[]): string[] {
  const problems: string[] = [];

  if (input.noMatch && input.items.length > 0) {
    problems.push("Przy noMatch = true lista items musi być pusta.");
  }
  if (!input.noMatch && input.items.length === 0) {
    problems.push("Lista items jest pusta. Podaj dopasowania albo ustaw noMatch = true.");
  }

  const seen = new Set<string>();
  for (const item of input.items) {
    if (seen.has(item.slug)) {
      problems.push(`Innowacja „${item.slug}” jest na liście więcej niż raz.`);
      continue;
    }
    seen.add(item.slug);

    const source = sources.find((candidate) => candidate.slug === item.slug);
    if (!source) {
      problems.push(`Nie ma innowacji o slugu „${item.slug}”. Używaj tylko slugów z searchInnovations.`);
      continue;
    }

    const quote = normalize(item.quote);
    const quoted = [source.solution, source.problem, source.lead].some((text) => text && normalize(text).includes(quote));
    if (!quoted) {
      problems.push(
        `Cytat dla „${item.slug}” nie występuje w polu solution, problem ani lead. Skopiuj fragment dosłownie z getInnovation.`,
      );
    }
  }

  return problems;
}
