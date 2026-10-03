import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getToolName, isToolUIPart, tool, type UIMessage } from "ai";
import { ASK_QUESTION } from "@/lib/ai/client-tools";
import { sharedTools } from "@/lib/ai/tools";
import type { Database } from "@/lib/supabase/database.types";
import {
  checkMatches,
  showMatchesInput,
  type MatchSource,
  type ShowMatchesInput,
  type ShowMatchesOutput,
} from "./show-matches";

/** Matchmaking asks at most one follow-up per conversation. */
function hasAskedQuestion(messages: UIMessage[]) {
  return messages.some((message) =>
    message.parts.some((part) => isToolUIPart(part) && getToolName(part) === ASK_QUESTION),
  );
}

async function showMatches(
  supabase: SupabaseClient<Database>,
  input: ShowMatchesInput,
): Promise<ShowMatchesOutput> {
  let sources: MatchSource[] = [];
  if (input.items.length > 0) {
    const { data, error } = await supabase
      .from("innovations")
      .select("slug, solution, problem")
      .in(
        "slug",
        input.items.map((item) => item.slug),
      )
      .eq("published", true);
    if (error) throw new Error(`showMatches failed: ${error.message}`);
    sources = data ?? [];
  }

  const problems = checkMatches(input, sources);
  return problems.length > 0 ? { shown: false, problems } : { shown: true };
}

export function matchmakingTools(supabase: SupabaseClient<Database>, messages: UIMessage[]) {
  const { askQuestion, ...search } = sharedTools(supabase);

  return {
    ...search,
    // Withheld after the first follow-up, so a second one cannot happen.
    ...(hasAskedQuestion(messages) ? {} : { askQuestion }),
    showMatches: tool({
      description:
        "Pokaż osobie wyniki: do 5 innowacji z uzasadnieniem i cytatem ze źródła, albo brak dopasowania (noMatch). Wynik { shown: false, problems } oznacza, że trzeba poprawić dane i wywołać narzędzie ponownie.",
      inputSchema: showMatchesInput,
      execute: (input) => showMatches(supabase, input),
    }),
  };
}
