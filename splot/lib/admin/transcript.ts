import { getToolName, isToolUIPart, type UIMessage } from "ai";
import type { AskQuestionInput, AskQuestionOutput } from "@/lib/ai/tools/ask-question";
import { ASK_QUESTION } from "@/lib/ai/client-tools";
import { SHOW_MATCHES, type ShowMatchesInput, type ShowMatchesOutput } from "@/lib/matchmaking/show-matches";

/** One line of the read-only transcript in the submission detail. */
export type TranscriptEntry =
  | { kind: "text"; from: "author" | "assistant"; text: string }
  /** A tool card, told in one sentence, e.g. „Pokazano 5 innowacji”. */
  | { kind: "tool"; text: string };

function innovationsShown(count: number) {
  if (count === 1) return "Pokazano 1 innowację";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  const few = lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14);
  return `Pokazano ${count} ${few ? "innowacje" : "innowacji"}`;
}

/** The sentence for one finished tool call; `null` hides internal steps. */
function toolSummary(name: string, input: unknown, output: unknown): string | null {
  if (name === SHOW_MATCHES) {
    if (!(output as ShowMatchesOutput | undefined)?.shown) return null;
    const { items, noMatch } = input as ShowMatchesInput;
    return noMatch || items.length === 0 ? "Nie znaleziono pasującej innowacji" : innovationsShown(items.length);
  }
  if (name === ASK_QUESTION) {
    const { question } = input as AskQuestionInput;
    const answer = output as AskQuestionOutput;
    return answer ? `Pytanie: „${question}” — odpowiedź: „${answer}”` : `Pytanie: „${question}” — pominięte`;
  }
  if (name === "searchInnovations") return "Przeszukano Bibliotekę Innowacji";
  return null;
}

/**
 * Text parts only; finished tool cards become one sentence each, so ROPS
 * reads the conversation without the interactive UI.
 */
export function toTranscript(messages: UIMessage[]): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];

  for (const message of messages) {
    if (message.role === "system") continue;
    const from = message.role === "user" ? "author" : "assistant";

    for (const part of message.parts) {
      if (part.type === "text") {
        const text = part.text.trim();
        if (text) entries.push({ kind: "text", from, text });
        continue;
      }
      if (!isToolUIPart(part) || part.state !== "output-available") continue;

      const text = toolSummary(getToolName(part), part.input, part.output);
      // Parallel searches in one reply read as one step.
      const last = entries.at(-1);
      if (text && !(last?.kind === "tool" && last.text === text)) entries.push({ kind: "tool", text });
    }
  }

  return entries;
}
