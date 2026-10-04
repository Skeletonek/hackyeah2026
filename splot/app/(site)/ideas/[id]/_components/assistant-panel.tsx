"use client";

import { useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { Lightbulb } from "lucide-react";
import { AiHint } from "@/components/ai/ai-hint";
import {
  ChatSurface,
  type AddToolOutput,
  type RenderToolPart,
  type ToolPart,
} from "@/components/ai/chat-surface";
import { InnovationCard } from "@/components/innovation-card";
import { Button } from "@/components/ui/button";
import { useSkillChat } from "@/lib/ai/use-skill-chat";
import type { IdeaCardValues } from "@/lib/ideas/card";
import type {
  ListGapsInput,
  ShowSimilarItem,
  SuggestEditsInput,
} from "@/lib/ideas/assistant-tools";
import { setIdeaConversation } from "../../actions";
import { LeafletCard } from "./leaflet-card";

/** Where „Wstaw” lands and what „Warto dopisać” focuses. */
const FIELD_LABELS: Record<string, string> = {
  title: "Nazwa pomysłu",
  solution: "Na czym polega",
  problem: "Jaki problem rozwiązuje",
  audience: "Odbiorcy",
  location: "Gdzie",
  reach: "Ile osób skorzysta",
};

function fieldElement(field: string): HTMLInputElement | HTMLTextAreaElement | null {
  const form = document.getElementById("idea-card-form");
  const element = form?.querySelector(`[name="${field}"]`);
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    ? element
    : null;
}

/** Live form state, including text the person has not saved yet. */
function readLiveCard(snapshot: IdeaCardValues): IdeaCardValues {
  const form = document.getElementById("idea-card-form") as HTMLFormElement | null;
  if (!form) return snapshot;
  const data = new FormData(form);
  const text = (name: keyof IdeaCardValues, fallback: string) => {
    const value = data.get(name);
    return typeof value === "string" ? value : fallback;
  };
  const list = (name: keyof IdeaCardValues, fallback: string[]) => {
    const values = data.getAll(name).map(String);
    return values.length > 0 ? values : fallback;
  };
  return {
    title: text("title", snapshot.title),
    solution: text("solution", snapshot.solution),
    problem: text("problem", snapshot.problem),
    target_groups: list("target_groups", snapshot.target_groups) as IdeaCardValues["target_groups"],
    audience: text("audience", snapshot.audience),
    location: text("location", snapshot.location),
    reach: text("reach", snapshot.reach),
    stage: (text("stage", snapshot.stage) || "") as IdeaCardValues["stage"],
    assets: list("assets", snapshot.assets) as IdeaCardValues["assets"],
  };
}

function partInput<T>(part: ToolPart): T {
  return (part as { input?: T }).input as T;
}

function partOutput<T>(part: ToolPart): T | undefined {
  return (part as { output?: T }).output;
}

/**
 * „A może inaczej?”: suggestion cards that write into the wizard form.
 * Every „Wstaw” applies at once and is announced; the output records it.
 */
function SuggestEditsPart({
  part,
  addToolOutput,
  announce,
}: {
  part: ToolPart;
  addToolOutput: AddToolOutput;
  announce: (text: string) => void;
}) {
  const { items } = partInput<SuggestEditsInput>(part);
  const [applied, setApplied] = useState<string[]>(() => partOutput<{ applied?: string[] }>(part)?.applied ?? []);

  const apply = (id: string, field: string, text: string, mode: "append" | "replace") => {
    const element = fieldElement(field);
    if (!element) {
      announce(`Nie znaleziono pola ${FIELD_LABELS[field] ?? field}.`);
      return;
    }
    element.value =
      mode === "append" && element.value.trim() ? `${element.value.trim()}\n\n${text}` : text;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    const next = applied.includes(id) ? applied : [...applied, id];
    setApplied(next);
    announce(`Wstawiono do pola ${FIELD_LABELS[field] ?? field}.`);
    void addToolOutput({ tool: "suggestEdits", toolCallId: part.toolCallId, output: { applied: next, dismissed: false } });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="font-bold">A może inaczej?</p>
      {items.map((item) => {
        const done = applied.includes(item.id);
        return (
          <div key={item.id} className="flex flex-col gap-2 rounded-lg border-2 border-border bg-card p-4">
            <p className="font-bold">{item.title}</p>
            <p className="max-w-[68ch]">{item.text}</p>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={done}
                onClick={() => apply(item.id, item.field, item.text, item.mode)}
              >
                {done ? "Wstawione" : item.mode === "append" ? "Dodaj do opisu" : "Wstaw"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** „Warto jeszcze dopisać”: every item focuses its field when it has one. */
function ListGapsPart({ part }: { part: ToolPart }) {
  const { items } = partInput<ListGapsInput>(part);

  const focus = (field: string | undefined) => {
    if (!field) return;
    const form = document.getElementById("idea-card-form");
    const target = (form?.querySelector(`[name="${field}"]`) ??
      form?.querySelector(`input[name="${field}"]`)) as HTMLElement | null;
    target?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold">Warto jeszcze dopisać</p>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={`${item.text}-${index}`}>
            {item.field ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-auto min-h-11 justify-start py-2 font-normal whitespace-normal"
                onClick={() => focus(item.field)}
              >
                {item.text}
              </Button>
            ) : (
              <p>{item.text}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Similar innovations from the library with „Dlaczego to pasuje”. */
function ShowSimilarPart({ part, conversationId }: { part: ToolPart; conversationId: string }) {
  const items = (partOutput<ShowSimilarItem[]>(part) ?? []) as ShowSimilarItem[];
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="font-bold">Podobne pomysły z biblioteki</p>
      {items.map((item) => (
        <InnovationCard
          key={item.slug}
          slug={item.slug}
          title={item.title}
          lead={item.lead}
          categories={item.categories}
          stage={item.stage}
          headingLevel="h4"
          why={
            <AiHint
              framed={false}
              targetType="similar_reason"
              targetId={`${conversationId}:${item.slug}`.slice(0, 200)}
              className="mt-2"
            >
              <p>{item.why}</p>
            </AiHint>
          }
        />
      ))}
    </div>
  );
}

/**
 * The idea assistant beside the wizard: proactive once per step, reading the
 * live form state. Below the form on mobile (the shell stacks), beside it on
 * desktop. Keyboard only works throughout: it is a chat with buttons.
 */
export function AssistantPanel({
  ideaId,
  step,
  snapshot,
  conversationId: initialConversationId,
  initialMessages,
}: {
  ideaId: string;
  step: 1 | 2 | 3 | 4;
  /** The saved card; the live form state is read from the page when present. */
  snapshot: IdeaCardValues;
  /** `ideas.conversation_id`, so a resumed draft restores the chat. */
  conversationId: string | null;
  initialMessages: UIMessage[];
}) {
  const [conversationId] = useState(() => initialConversationId ?? crypto.randomUUID());
  const [announcement, setAnnouncement] = useState("");
  const linkedRef = useRef(Boolean(initialConversationId));

  const { messages, status, sendMessage, addToolOutput, regenerate, stop } = useSkillChat<{
    step: number;
    card: IdeaCardValues;
  }>("idea-assistant", conversationId, initialMessages, {
    getContext: () => ({ step, card: readLiveCard(snapshot) }),
  });

  // The first message owns the conversation: link it to the card.
  const ensureLinked = () => {
    if (linkedRef.current) return Promise.resolve();
    linkedRef.current = true;
    return setIdeaConversation(ideaId, conversationId).catch((error: unknown) => {
      console.error("setIdeaConversation failed", error);
    });
  };

  // Proactive once per step: on first entry the assistant asks the Kanwa
  // question for this step. Never on revisits, never twice.
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (autoSentRef.current || status !== "ready" || messages.length > 0) return;
    let entered: number[] = [];
    try {
      entered = JSON.parse(localStorage.getItem(`idea-assistant:auto:${conversationId}`) ?? "[]");
    } catch {
      entered = [];
    }
    if (entered.includes(step)) return;
    autoSentRef.current = true;
    try {
      localStorage.setItem(`idea-assistant:auto:${conversationId}`, JSON.stringify([...entered, step]));
    } catch {
      // Private mode: the turn still goes out, just without the revisit guard.
    }
    void ensureLinked().finally(() => {
      void sendMessage({ text: `Otwarto krok ${step} z 4.`, metadata: { auto: true } });
    });
    // Once per mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderToolPart: Record<string, RenderToolPart> = {
    suggestEdits: (part, { streaming }) =>
      streaming ? null : (
        <SuggestEditsPart part={part} addToolOutput={addToolOutput} announce={setAnnouncement} />
      ),
    showLeaflet: (part, { streaming }) =>
      streaming ? null : (
        <LeafletCard
          input={partInput(part)}
          conversationId={conversationId}
          onAnswer={(output) =>
            void addToolOutput({ tool: "showLeaflet", toolCallId: part.toolCallId, output })
          }
        />
      ),
    showSimilar: (part, { streaming }) =>
      streaming ? null : <ShowSimilarPart part={part} conversationId={conversationId} />,
    listGaps: (part, { streaming }) => (streaming ? null : <ListGapsPart part={part} />),
  };

  return (
    <section aria-labelledby="assistant-heading" className="flex min-w-0 flex-col gap-4">
      <h2 id="assistant-heading" className="flex items-center gap-2 text-h3 simple:text-simple-h3">
        <Lightbulb aria-hidden className="size-6 shrink-0" strokeWidth={2} />
        Asystent pomysłu
      </h2>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <ChatSurface
        messages={messages}
        status={status}
        onSend={(text) => {
          void ensureLinked().finally(() => {
            void sendMessage({ text });
          });
        }}
        onStop={() => stop()}
        onRetry={() => regenerate()}
        addToolOutput={addToolOutput}
        renderToolPart={renderToolPart}
        toolLabels={{
          searchInnovations: "Szukam podobnych pomysłów w bibliotece…",
          getInnovation: "Czytam opisy podobnych rozwiązań…",
          showSimilar: "Wybieram podobne rozwiązania…",
        }}
        finalTextOnly
        inputLabel="Zapytaj asystenta"
        inputHint="Na przykład: jak opisać to prościej?"
        feedbackTargetType="idea_assistant_message"
      />
    </section>
  );
}
