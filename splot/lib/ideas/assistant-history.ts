import type { UIMessage } from "ai";
import type { IdeaStep } from "./card";

export function stepEntryText(step: IdeaStep) {
  return `Otwarto krok ${step} z 4.`;
}

/** Stored hidden turns survive reloads and resuming on another device. */
export function hasEnteredIdeaStep(messages: UIMessage[], step: IdeaStep) {
  return messages.some(
    (message) =>
      message.role === "user" &&
      (message.metadata as { auto?: unknown } | undefined)?.auto === true &&
      message.parts.some((part) => part.type === "text" && part.text === stepEntryText(step)),
  );
}
