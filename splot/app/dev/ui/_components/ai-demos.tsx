"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatStatus, UIMessage } from "ai";
import { AiBadge } from "@/components/ai/ai-badge";
import { AiHint } from "@/components/ai/ai-hint";
import { AiThinking } from "@/components/ai/ai-thinking";
import { ChatBubble } from "@/components/ai/chat-bubble";
import { ChatSurface, type AddToolOutput, type ToolPart } from "@/components/ai/chat-surface";
import { QuickReplies } from "@/components/ai/quick-replies";
import { Button } from "@/components/ui/button";

const FIXTURE: UIMessage[] = [
  {
    id: "m0",
    role: "user",
    metadata: { auto: true },
    parts: [{ type: "text", text: "(wiadomość wysłana przez kod: nie powinna być widoczna)" }],
  },
  {
    id: "m1",
    role: "user",
    parts: [{ type: "text", text: "Seniorzy w naszej gminie nie mają jak dojechać do lekarza." }],
  },
  {
    id: "m2",
    role: "assistant",
    parts: [
      {
        type: "tool-askQuestion",
        toolCallId: "q1",
        state: "output-available",
        input: {
          question: "Gdzie mieszkają te osoby?",
          options: ["W mieście", "Na wsi", "W obu miejscach"],
          allowSkip: true,
        },
        output: "Na wsi",
      },
    ],
  },
  {
    id: "m3",
    role: "assistant",
    parts: [
      {
        type: "tool-searchInnovations",
        toolCallId: "s1",
        state: "output-available",
        input: { query: "transport seniorów do lekarza na wsi" },
        output: [],
      },
      {
        type: "tool-showMatches",
        toolCallId: "r1",
        state: "output-available",
        input: { matches: ["Wiejski transport sąsiedzki", "Teleasystent"] },
        output: null,
      },
      {
        type: "text",
        state: "done",
        text: "Znalazłem 2 rozwiązania, które działają w małych gminach.\nPierwsze opiera się na sąsiadach, którzy mają samochód.",
      },
    ],
  },
  {
    id: "m4",
    role: "assistant",
    parts: [
      {
        type: "tool-askQuestion",
        toolCallId: "q2",
        state: "input-available",
        input: {
          question: "Czy chcesz zapisać wyniki?",
          options: ["Tak, zapisz", "Wyślij mi na e-mail"],
          allowSkip: true,
        },
      },
    ],
  },
];

const REPLY =
  "Dziękuję. W bibliotece ROPS jest rozwiązanie, które łączy seniorów z wolontariuszami-kierowcami. Sprawdziło się w 3 gminach wiejskich.";

/** A transport-free stand-in for `useChat`: fake search, then streamed words. */
export function ChatDemo() {
  const [messages, setMessages] = useState<UIMessage[]>(FIXTURE);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const updateLast = (update: (message: UIMessage) => UIMessage) =>
    setMessages((current) => [...current.slice(0, -1), update(current.at(-1)!)]);

  const finish = () => {
    clearTimers();
    updateLast((message) => ({
      ...message,
      parts: message.parts.map((part) => (part.type === "text" ? { ...part, state: "done" } : part)),
    }));
    setStatus("ready");
  };

  const onSend = (text: string) => {
    const id = crypto.randomUUID();
    setMessages((current) => [...current, { id: `${id}-user`, role: "user", parts: [{ type: "text", text }] }]);
    setStatus("submitted");

    later(800, () => {
      setStatus("streaming");
      setMessages((current) => [
        ...current,
        {
          id,
          role: "assistant",
          parts: [
            {
              type: "tool-searchInnovations",
              toolCallId: `${id}-search`,
              state: "input-available",
              input: { query: text },
            },
          ],
        },
      ]);
    });

    const words = REPLY.split(" ");
    words.forEach((_, index) =>
      later(2200 + index * 120, () =>
        updateLast((message) => ({
          ...message,
          parts: [
            {
              type: "tool-searchInnovations",
              toolCallId: `${id}-search`,
              state: "output-available",
              input: { query: text },
              output: [],
            },
            { type: "text", state: "streaming", text: words.slice(0, index + 1).join(" ") },
          ],
        })),
      ),
    );
    later(2200 + words.length * 120 + 100, finish);
  };

  const addToolOutput: AddToolOutput = ({ toolCallId, output }) => {
    setMessages((current) =>
      current.map((message) => ({
        ...message,
        parts: message.parts.map((part) =>
          "toolCallId" in part && part.toolCallId === toolCallId
            ? ({ ...part, state: "output-available", output } as typeof part)
            : part,
        ),
      })),
    );

    // Like `useSkillChat`: an answer continues the turn, and the reply is
    // appended to the same assistant message.
    const words = `Zapisuję Twoją odpowiedź: ${output ?? "pominięto"}.`.split(" ");
    setStatus("submitted");
    later(600, () => setStatus("streaming"));
    words.forEach((_, index) =>
      later(800 + index * 120, () =>
        updateLast((message) => ({
          ...message,
          parts: [
            ...message.parts.filter((part) => part.type !== "text" || part.state !== "streaming"),
            { type: "text", state: "streaming", text: words.slice(0, index + 1).join(" ") },
          ],
        })),
      ),
    );
    later(800 + words.length * 120 + 100, finish);
  };

  return (
    <div className="flex flex-col gap-4">
      <ChatSurface
        messages={messages}
        status={status}
        onSend={onSend}
        onStop={finish}
        onRetry={() => setStatus("ready")}
        addToolOutput={addToolOutput}
        toolLabels={{ searchInnovations: "Przeglądam 100 innowacji…" }}
        renderToolPart={{ showMatches: (part) => <MatchesDemo part={part} /> }}
        placeholder="Np. brakuje opieki wytchnieniowej dla rodzin."
      />
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={() => setStatus("error")}>
          Pokaż błąd strumienia
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearTimers();
            setMessages(FIXTURE);
            setStatus("ready");
          }}
        >
          Przywróć fixture
        </Button>
      </div>
    </div>
  );
}

/** What a stream passes in `renderToolPart`, e.g. Matchmaking's result cards. */
function MatchesDemo({ part }: { part: ToolPart }) {
  const matches = (part.input as { matches?: string[] } | undefined)?.matches ?? [];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {matches.map((title) => (
        <li key={title} className="rounded-lg border-2 border-border bg-card p-5 font-bold shadow-sm">
          {title}
        </li>
      ))}
    </ul>
  );
}

export function QuickRepliesDemo() {
  const [answer, setAnswer] = useState<string | null>();
  return (
    <div className="flex flex-col gap-3">
      <QuickReplies
        question="Ilu osób dotyczy ten problem?"
        options={["Kilku osób", "Całej wsi", "Całej gminy"]}
        answer={answer}
        onAnswer={setAnswer}
      />
      {answer !== undefined && (
        <Button variant="link" size="sm" className="w-fit" onClick={() => setAnswer(undefined)}>
          Odpowiedz jeszcze raz
        </Button>
      )}
    </div>
  );
}

export function AiStaticDemos() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <AiBadge />
        <AiThinking label="Przeglądam 100 innowacji…" />
      </div>
      <div className="flex flex-col gap-4">
        <ChatBubble from="me" meta="sob., 3 października, 14:02">
          <p>Kiedy dostanę odpowiedź?</p>
        </ChatBubble>
        <ChatBubble from="them" author="Anna, ROPS Kraków">
          <p>Dzień dobry. Odpowiemy w ciągu 5 dni roboczych.</p>
        </ChatBubble>
        <ChatBubble from="ai">
          <p>Dymek asystenta bez reakcji: używaj go razem z AiHint.</p>
        </ChatBubble>
      </div>
      <AiHint targetType="easy_read" targetId="dev-ui-easy-read">
        <p>
          BaWita to drewniana tablica z 7 ruchomymi elementami. Pomaga ćwiczyć pamięć osobom z demencją.
        </p>
      </AiHint>
    </div>
  );
}
