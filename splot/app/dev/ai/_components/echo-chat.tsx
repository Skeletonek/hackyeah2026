"use client";

import { useState } from "react";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSkillChat } from "@/lib/ai/use-skill-chat";
import type { AskQuestionInput } from "@/lib/ai/tools/ask-question";

/** Bare stand-in for `ChatSurface` (F4), enough to prove the loop. */
export function EchoChat({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: UIMessage[];
}) {
  const { messages, status, error, sendMessage, addToolOutput, regenerate, stop } = useSkillChat(
    "echo",
    conversationId,
    initialMessages,
  );
  const [text, setText] = useState("");
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col gap-6">
      <ol role="log" aria-live="polite" aria-label="Rozmowa" className="flex flex-col gap-4">
        {messages.map((message) => (
          <li key={message.id} className="rounded-md border-2 border-border bg-card p-4">
            <p className="text-sm font-bold text-muted-foreground">
              {message.role === "user" ? "Ty" : "Asystent (AI)"}
            </p>
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return (
                  <p key={index} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                );
              }
              if (!isToolUIPart(part) || getToolName(part) !== "askQuestion") return null;
              if (part.state === "input-streaming") return null;

              const { question, options, allowSkip } = part.input as AskQuestionInput;
              const answer = (output: string | null) =>
                addToolOutput({ tool: "askQuestion", toolCallId: part.toolCallId, output });

              return (
                <div key={index} className="mt-2 flex flex-col gap-3">
                  <p className="font-bold">{question}</p>
                  {part.state === "input-available" ? (
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => (
                        <Button key={option} variant="outline" size="sm" onClick={() => answer(option)}>
                          {option}
                        </Button>
                      ))}
                      {allowSkip && (
                        <Button variant="ghost" size="sm" onClick={() => answer(null)}>
                          Pomiń
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Odpowiedź: {typeof part.output === "string" ? part.output : "pominięto"}
                    </p>
                  )}
                </div>
              );
            })}
          </li>
        ))}
      </ol>

      {error && (
        <Alert
          tone="error"
          title="Coś poszło nie tak. Spróbuj ponownie"
          action={
            <Button variant="outline" size="sm" onClick={() => regenerate()}>
              Spróbuj ponownie
            </Button>
          }
        />
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (busy || !text.trim()) return;
          sendMessage({ text: text.trim() });
          setText("");
        }}
      >
        <Field label="Twoja wiadomość">
          <Input value={text} onChange={(event) => setText(event.target.value)} autoComplete="off" />
        </Field>
        {busy ? (
          <Button type="button" variant="outline" onClick={() => stop()}>
            Zatrzymaj
          </Button>
        ) : (
          <Button type="submit">Wyślij</Button>
        )}
      </form>
    </div>
  );
}
