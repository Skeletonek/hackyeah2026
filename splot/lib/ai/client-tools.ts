import { getToolName, isToolUIPart, type UIMessage } from "ai";

/** Shared by the handler and `useSkillChat`, so both close and read tool calls the same way. */

export const ASK_QUESTION = "askQuestion";
export const SHOW_LEAFLET = "showLeaflet";

/** Output of a client tool call the person skipped by typing instead. */
export function dismissedOutput(toolName: string) {
  return toolName === ASK_QUESTION ? null : { dismissed: true };
}

/** Tool parts of the last step; a client tool call always ends its step. */
export function lastStepToolParts(message: UIMessage) {
  const lastStepStart = message.parts.findLastIndex((part) => part.type === "step-start");
  return message.parts
    .slice(lastStepStart + 1)
    .filter(isToolUIPart)
    .filter((part) => !part.providerExecuted);
}

/** Closes every client tool call that is still waiting for the person. */
export function dismissPendingToolCalls<MESSAGE extends UIMessage>(message: MESSAGE): MESSAGE {
  if (!message.parts.some((part) => isToolUIPart(part) && part.state === "input-available")) {
    return message;
  }
  return {
    ...message,
    parts: message.parts.map((part) =>
      isToolUIPart(part) && part.state === "input-available"
        ? { ...part, state: "output-available", output: dismissedOutput(getToolName(part)) }
        : part,
    ),
  };
}
