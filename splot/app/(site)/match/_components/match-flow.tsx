"use client";

import { useEffect, useRef, useState } from "react";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { AiThinking } from "@/components/ai/ai-thinking";
import { ChatSurface, type RenderToolPart } from "@/components/ai/chat-surface";
import { useSkillChat } from "@/lib/ai/use-skill-chat";
import { MATCH_EXAMPLES } from "@/lib/matchmaking/examples";
import { SHOW_MATCHES, type ShowMatchesInput, type ShowMatchesOutput } from "@/lib/matchmaking/show-matches";
import type { MatchmakingContext } from "@/lib/matchmaking/skill";
import { problemDescription } from "@/lib/matchmaking/submission-body";
import type { SavedSubmission } from "../actions";
import { Confirmation } from "./confirmation";
import { MatchEntry } from "./match-entry";
import { NoMatch } from "./no-match";
import { Results, matchedInnovations } from "./results";

/**
 * `/match`: the entry screen until the first message, then the conversation
 * (the single follow-up and progress in words) with the results in it.
 */
export function MatchFlow({
  conversationId,
  initialMessages,
  role,
  innovationCount,
  hasAccount,
}: {
  conversationId: string;
  initialMessages: UIMessage[];
  role: MatchmakingContext["role"];
  /** Published innovations, for „Przeglądam 100 innowacji…”. */
  innovationCount: number;
  /** Signed in with a real account, so `/account` is open to this person. */
  hasAccount: boolean;
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

  // Results that arrive during this visit take focus; a reloaded conversation does not.
  const [hadTurn, setHadTurn] = useState(false);
  if (busy && !hadTurn) setHadTurn(true);

  const innovations = matchedInnovations(messages);
  const latestShown = messages
    .flatMap((message) => message.parts)
    .filter(isToolUIPart)
    .findLast(
      (part) =>
        getToolName(part) === SHOW_MATCHES &&
        part.state === "output-available" &&
        (part.output as ShowMatchesOutput).shown,
    )?.toolCallId;

  // The reply in progress shows one „Wybieram…”, also when showMatches runs twice.
  const liveShowMatches = messages
    .at(-1)
    ?.parts.filter(isToolUIPart)
    .findLast((part) => getToolName(part) === SHOW_MATCHES)?.toolCallId;

  const renderShowMatches: RenderToolPart = (part, { streaming }) => {
    // ChatSurface remounts a message when its turn ends, so the results wait
    // for that: mounted once, they keep their focus and state.
    if (streaming) {
      return part.toolCallId === liveShowMatches ? <AiThinking label={showMatchesLabel} /> : null;
    }
    if (part.state !== "output-available" || !(part.output as ShowMatchesOutput).shown) return null;

    const input = part.input as ShowMatchesInput;
    if (input.noMatch) {
      return (
        <NoMatch
          conversationId={conversationId}
          description={problemDescription(messages)}
          onSaved={setSaved}
        />
      );
    }
    return (
      <Results
        conversationId={conversationId}
        items={input.items}
        innovations={innovations}
        latest={part.toolCallId === latestShown}
        focusOnMount={hadTurn}
        hasAccount={hasAccount}
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
        finalTextOnly
        inputLabel="Chcesz coś dodać do opisu?"
        inputHint="Możesz dopisać szczegóły albo opisać problem inaczej."
        feedbackTargetType="matchmaking_message"
      />
    </div>
  );
}
