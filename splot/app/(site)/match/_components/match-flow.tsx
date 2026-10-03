"use client";

import { useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { AiThinking } from "@/components/ai/ai-thinking";
import { ChatSurface, type ToolPart } from "@/components/ai/chat-surface";
import { useSkillChat } from "@/lib/ai/use-skill-chat";
import { MATCH_EXAMPLES } from "@/lib/matchmaking/examples";
import type { ShowMatchesInput, ShowMatchesOutput } from "@/lib/matchmaking/show-matches";
import type { MatchmakingContext } from "@/lib/matchmaking/skill";
import { problemDescription } from "@/lib/matchmaking/submission-body";
import type { SavedSubmission } from "../actions";
import { Confirmation } from "./confirmation";
import { MatchEntry } from "./match-entry";
import { NoMatch } from "./no-match";

/**
 * The first half of `/match`: the entry screen until the first message, then
 * the conversation (the single follow-up and progress in words).
 */
export function MatchFlow({
  conversationId,
  initialMessages,
  role,
  innovationCount,
}: {
  conversationId: string;
  initialMessages: UIMessage[];
  role: MatchmakingContext["role"];
  /** Published innovations, for „Przeglądam 100 innowacji…”. */
  innovationCount: number;
}) {
  const { messages, status, sendMessage, addToolOutput, regenerate, stop } = useSkillChat<MatchmakingContext>(
    "matchmaking",
    conversationId,
    initialMessages,
    { getContext: () => ({ role }) },
  );

  const [saved, setSaved] = useState<SavedSubmission | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const started = messages.length > 0;
  const startedHere = started && initialMessages.length === 0;

  // The entry field is gone after the first send; focus moves to the field that replaced it.
  useEffect(() => {
    if (startedHere) chatRef.current?.querySelector("textarea")?.focus();
  }, [startedHere]);

  const start = (text: string) => {
    // The id goes into the URL only now, so a reload resumes this conversation.
    const params = new URLSearchParams(window.location.search);
    params.set("c", conversationId);
    window.history.replaceState(null, "", `?${params}`);
    sendMessage({ text });
  };

  const showMatchesLabel = "Wybieram najlepsze rozwiązania…";
  const busy = status === "submitted" || status === "streaming";

  const renderShowMatches = (part: ToolPart) => {
    if (part.state === "input-streaming" || part.state === "input-available") {
      return busy ? <AiThinking label={showMatchesLabel} /> : null;
    }
    if (part.state !== "output-available" || !(part.output as ShowMatchesOutput).shown) return null;
    // The results list (MM5) comes with M3.
    if (!(part.input as ShowMatchesInput).noMatch) return null;
    return (
      <NoMatch
        conversationId={conversationId}
        description={problemDescription(messages)}
        onSaved={setSaved}
      />
    );
  };

  if (!started) return <MatchEntry examples={MATCH_EXAMPLES[role]} onSubmit={start} />;
  if (saved) return <Confirmation saved={saved} />;

  return (
    <div ref={chatRef}>
      <ChatSurface
        messages={messages}
        status={status}
        onSend={(text) => sendMessage({ text })}
        onStop={() => stop()}
        onRetry={() => regenerate()}
        addToolOutput={addToolOutput}
        toolLabels={{
          searchInnovations: `Przeglądam ${innovationCount} innowacji z Biblioteki ROPS…`,
          getInnovation: "Czytam opisy rozwiązań, które mogą pasować…",
          showMatches: showMatchesLabel,
        }}
        renderToolPart={{ showMatches: renderShowMatches }}
        inputLabel="Chcesz coś dodać do opisu?"
        inputHint="Możesz dopisać szczegóły albo opisać problem inaczej."
        feedbackTargetType="matchmaking_message"
      />
    </div>
  );
}
