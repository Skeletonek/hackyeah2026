"use client";

import type { UIMessage } from "ai";
import { ChatSurface } from "@/components/ai/chat-surface";
import { useSkillChat } from "@/lib/ai/use-skill-chat";

/** The echo Skill in the real `ChatSurface`, to prove the loop end to end. */
export function EchoChat({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: UIMessage[];
}) {
  const { messages, status, sendMessage, addToolOutput, regenerate, stop } = useSkillChat(
    "echo",
    conversationId,
    initialMessages,
  );

  return (
    <ChatSurface
      messages={messages}
      status={status}
      onSend={(text) => sendMessage({ text })}
      onStop={() => stop()}
      onRetry={() => regenerate()}
      addToolOutput={addToolOutput}
      feedbackTargetType="dev_echo"
    />
  );
}
