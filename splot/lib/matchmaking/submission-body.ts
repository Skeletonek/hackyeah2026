import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { ASK_QUESTION } from "@/lib/ai/client-tools";
import type { AskQuestionInput, AskQuestionOutput } from "@/lib/ai/tools/ask-question";

/** `submissions.body` check: 3–5000 characters. */
export const MAX_BODY_LENGTH = 5000;

/** Text the person typed in one message; hidden `auto` turns the page sent itself are skipped. */
function typedText(message: UIMessage) {
  const metadata = message.metadata as { auto?: boolean } | undefined;
  if (message.role !== "user" || metadata?.auto) return "";
  return message.parts
    .map((part) => (part.type === "text" ? part.text.trim() : ""))
    .filter(Boolean)
    .join("\n");
}

/** The first description of the problem, e.g. to prefill the idea builder. */
export function problemDescription(messages: UIMessage[]) {
  for (const message of messages) {
    const text = typedText(message);
    if (text) return text;
  }
  return "";
}

/**
 * `submissions.body` of a matchmaking conversation: everything the person
 * typed plus the answered follow-up, in order. Skipped questions are left out.
 */
export function matchSubmissionBody(messages: UIMessage[]) {
  const blocks: string[] = [];

  for (const message of messages) {
    const text = typedText(message);
    if (text) blocks.push(text);

    if (message.role !== "assistant") continue;
    for (const part of message.parts) {
      if (!isToolUIPart(part) || getToolName(part) !== ASK_QUESTION) continue;
      if (part.state !== "output-available") continue;
      const answer = part.output as AskQuestionOutput;
      if (!answer) continue;
      const { question } = part.input as AskQuestionInput;
      blocks.push(`${question}\nOdpowiedź: ${answer}`);
    }
  }

  const body = blocks.join("\n\n");
  return body.length > MAX_BODY_LENGTH ? `${body.slice(0, MAX_BODY_LENGTH - 1)}…` : body;
}
