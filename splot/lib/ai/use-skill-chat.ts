"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, type UIMessage } from "ai";
import {
  ASK_QUESTION,
  SHOW_LEAFLET,
  dismissPendingToolCalls,
  lastStepToolParts,
} from "./client-tools";

/**
 * Continue the turn only after a click the model has to react to: an
 * `askQuestion` answer or a leaflet „retry”. Other client tool outputs wait
 * and ride along with the next user message, so those clicks cost no model call.
 */
function shouldContinue({ messages }: { messages: UIMessage[] }) {
  const last = messages.at(-1);
  if (last?.role !== "assistant") return false;

  const calls = lastStepToolParts(last);
  if (calls.length === 0 || calls.some((part) => part.state !== "output-available")) return false;

  return calls.some((part) => {
    const name = getToolName(part);
    if (name === ASK_QUESTION) return true;
    const output = part.output as { decision?: unknown } | null | undefined;
    return name === SHOW_LEAFLET && output?.decision === "retry";
  });
}

/** Holds the page's latest `getContext`, so the long-lived transport never reads a stale one. */
class ContextSource {
  constructor(private getContext?: () => unknown) {}

  set(getContext?: () => unknown) {
    this.getContext = getContext;
  }

  read() {
    return this.getContext?.();
  }
}

function createTransport(skill: string, contextSource: ContextSource) {
  return new DefaultChatTransport<UIMessage>({
    api: `/api/agent/${skill}`,
    prepareSendMessagesRequest({ id, messages, trigger }) {
      const last = messages.at(-1);
      const answered = messages.findLast((message) => message.role === "assistant");
      return {
        body: {
          id,
          trigger,
          message: last?.role === "user" ? last : undefined,
          toolOutputs: answered
            ? lastStepToolParts(answered)
                .filter((part) => part.state === "output-available")
                .map((part) => ({ toolCallId: part.toolCallId, output: part.output ?? null }))
            : [],
          context: contextSource.read(),
        },
      };
    },
  });
}

/**
 * `useChat` for a Skill at `/api/agent/<skill>`. The server keeps the history,
 * so each request carries only the new message, the conversation id, client
 * tool outputs and the page's `context`.
 *
 * @param conversationId uuid from `?c=<id>`; a new one starts a conversation.
 * @param initialMessages from `loadConversationMessages()` on the server.
 */
export function useSkillChat<CONTEXT = undefined>(
  skill: string,
  conversationId: string,
  initialMessages: UIMessage[],
  { getContext }: { getContext?: () => CONTEXT } = {},
) {
  // Read at send time, so `context` is the live form state.
  const [contextSource] = useState(() => new ContextSource(getContext));
  useEffect(() => contextSource.set(getContext));

  const [transport] = useState(() => createTransport(skill, contextSource));

  const chat = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: shouldContinue,
  });

  const sendMessage: typeof chat.sendMessage = (message, options) => {
    // Typing while a quick reply or card is waiting closes it first
    // (`null` for askQuestion, `{ dismissed: true }` otherwise).
    chat.setMessages((messages) => {
      const last = messages.at(-1);
      return last?.role === "assistant"
        ? [...messages.slice(0, -1), dismissPendingToolCalls(last)]
        : messages;
    });
    return chat.sendMessage(message, options);
  };

  return { ...chat, sendMessage };
}
