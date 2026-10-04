import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import { z } from "zod";
import { sharedTools } from "@/lib/ai/tools";
import type { Database } from "@/lib/supabase/database.types";

/** Text fields of the idea card a suggestion can land in. */
export const SUGGESTABLE_FIELDS = ["title", "solution", "problem", "audience", "location", "reach"] as const;

export const suggestEditsInput = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(64).describe("Stabilny identyfikator propozycji w tej odpowiedzi."),
        field: z.enum(SUGGESTABLE_FIELDS).describe("Pole fiszki, do którego pasuje tekst."),
        title: z.string().trim().min(1).max(120).describe("Krótki nagłówek karty, np. „Odważniej”."),
        text: z.string().trim().min(1).max(1000).describe("Gotowe zdanie do wstawienia w pole."),
        mode: z.enum(["append", "replace"]).describe("Dopisać do pola czy zastąpić jego treść."),
      }),
    )
    .min(1)
    .max(3),
});

export type SuggestEditsInput = z.infer<typeof suggestEditsInput>;

/** Written by the suggestion cards: which proposals landed in the form. */
export type SuggestEditsOutput = { applied: string[]; dismissed: boolean };

export const showLeafletInput = z.object({
  title: z.string().trim().min(1).max(120).describe("Tytuł ulotki, zwykle nazwa pomysłu."),
  tagline: z.string().trim().min(1).max(200).describe("Jedno zdanie zachęty."),
  when: z.string().trim().max(200).optional().describe("Kiedy się dzieje, jeśli wiadomo z fiszki."),
  where: z.string().trim().max(200).optional().describe("Gdzie się dzieje, jeśli wiadomo z fiszki."),
  who: z.string().trim().max(200).optional().describe("Dla kogo, jeśli wiadomo z fiszki."),
});

export type ShowLeafletInput = z.infer<typeof showLeafletInput>;

/** Written by the leaflet card: kept, another version, or closed. */
export type ShowLeafletOutput = { decision: "kept" | "retry" };

export const showSimilarInput = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(200).describe("Slug innowacji z wyników searchInnovations."),
        why: z
          .string()
          .trim()
          .min(1)
          .max(400)
          .describe("1–2 proste zdania o związku z pomysłem osoby."),
      }),
    )
    .min(1)
    .max(3),
});

export type ShowSimilarInput = z.infer<typeof showSimilarInput>;

export const listGapsInput = z.object({
  items: z
    .array(
      z.object({
        field: z
          .enum(SUGGESTABLE_FIELDS)
          .optional()
          .describe("Pole fiszki do uzupełnienia; puste, gdy uwagi nie da się przypisać do pola."),
        text: z.string().trim().min(1).max(300).describe("Jedno zdanie o tym, czego brakuje."),
      }),
    )
    .min(1)
    .max(5),
});

export type ListGapsInput = z.infer<typeof listGapsInput>;

/**
 * showSimilar is decided on the server: unknown slugs never reach the screen,
 * so the model cannot invent innovations. The other widgets are pure client
 * tools; the clicks come back as their outputs.
 */
async function showSimilar(supabase: SupabaseClient<Database>, input: ShowSimilarInput) {
  const { data, error } = await supabase
    .from("innovations")
    .select("slug, title, lead, categories, stage")
    .in(
      "slug",
      input.items.map((item) => item.slug),
    )
    .eq("published", true);
  if (error) throw new Error(`showSimilar failed: ${error.message}`);

  const bySlug = new Map((data ?? []).map((row) => [row.slug, row]));
  return input.items.flatMap((item) => {
    const innovation = bySlug.get(item.slug);
    return innovation ? [{ ...innovation, why: item.why }] : [];
  });
}

export type ShowSimilarItem = Awaited<ReturnType<typeof showSimilar>>[number];

export function ideaAssistantTools(supabase: SupabaseClient<Database>) {
  return {
    ...sharedTools(supabase),
    suggestEdits: tool({
      description:
        "Pokaż osobie 1–3 propozycje innego ujęcia jej pomysłu jako karty „A może inaczej?”. Każda trafia do wskazanego pola fiszki.",
      inputSchema: suggestEditsInput,
    }),
    showLeaflet: tool({
      description:
        "Pokaż ulotkę pomysłu: tytuł, zdanie zachęty i to, co wiadomo z fiszki. „Spróbuj inaczej” wraca do ciebie po nową wersję.",
      inputSchema: showLeafletInput,
    }),
    showSimilar: tool({
      description:
        "Pokaż osobie podobne innowacje z biblioteki z uzasadnieniem. Najpierw znajdź je narzędziem searchInnovations.",
      inputSchema: showSimilarInput,
      execute: (input) => showSimilar(supabase, input),
    }),
    listGaps: tool({
      description:
        "Pokaż osobie, co warto jeszcze dopisać do fiszki. Kliknięcie przenosi do pola.",
      inputSchema: listGapsInput,
    }),
  };
}