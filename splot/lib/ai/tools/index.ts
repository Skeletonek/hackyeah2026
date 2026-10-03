import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import type { Database } from "@/lib/supabase/database.types";
import { askQuestionInput } from "./ask-question";
import { getInnovation, getInnovationInput } from "./get-innovation";
import { searchInnovations, searchInnovationsInput } from "./search-innovations";

/**
 * Client tool (no `execute`): `ChatSurface` renders it as `QuickReplies` and
 * the click comes back as the tool output. Every Skill asks follow-ups this way.
 */
export const askQuestionTool = tool({
  description:
    "Zadaj osobie jedno pytanie doprecyzowujące z gotowymi odpowiedziami do kliknięcia. Wynik to wybrana odpowiedź albo null, gdy osoba pominęła pytanie.",
  inputSchema: askQuestionInput,
});

/**
 * Shared tools bound to the visitor's client. Use in a Skill:
 * `tools: ({ supabase }) => ({ ...sharedTools(supabase), ...own })`.
 */
export function sharedTools(supabase: SupabaseClient<Database>) {
  return {
    searchInnovations: tool({
      description:
        "Wyszukaj w Bibliotece Innowacji Społecznych rozwiązania pasujące do opisu problemu. Zwraca krótką listę z wynikiem dopasowania.",
      inputSchema: searchInnovationsInput,
      execute: (input) => searchInnovations(supabase, input),
    }),
    getInnovation: tool({
      description:
        "Pobierz pełny opis jednej innowacji po slugu. Zwraca null, gdy takiej innowacji nie ma.",
      inputSchema: getInnovationInput,
      execute: (input) => getInnovation(supabase, input),
    }),
    askQuestion: askQuestionTool,
  };
}

export { searchInnovations, searchInnovationsInput, getInnovation, getInnovationInput, askQuestionInput };
export type { InnovationMatch } from "./search-innovations";
export type { InnovationDetails } from "./get-innovation";
export type { AskQuestionInput, AskQuestionOutput } from "./ask-question";
