"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CornerDownLeft, Send, Sparkles } from "lucide-react";
import { AiHint } from "@/components/ai/ai-hint";
import { AiThinking } from "@/components/ai/ai-thinking";
import { ChatBubble } from "@/components/ai/chat-bubble";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { subscribeAsUser } from "@/lib/supabase/realtime";
import { toStaffThreadMessage, type MessageRow, type StaffThreadMessage } from "@/lib/threads/messages";
import type { ReplyDraft } from "@/lib/threads/reply-draft";
import { sendStaffReply, suggestReply, type StaffReplyState } from "../actions";

/** Adds messages once, whichever arrives first: the action's result or the Realtime event. */
function merge(current: StaffThreadMessage[], incoming: StaffThreadMessage): StaffThreadMessage[] {
  if (current.some((message) => message.id === incoming.id)) return current;
  return [...current, incoming].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function authorLabel(message: StaffThreadMessage) {
  if (message.fromAuthor) return "Autor zgłoszenia";
  return message.isOwn ? "Ty (ROPS)" : "ROPS";
}

/**
 * The ROPS side of a submission thread: the conversation over Realtime, an
 * AI-drafted reply the admin may insert and edit, and the reply box.
 */
export function StaffThread({
  submissionId,
  threadId,
  authorId,
  userId,
  initialMessages,
}: {
  submissionId: string;
  threadId: string;
  authorId: string;
  userId: string;
  initialMessages: StaffThreadMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState<ReplyDraft | null>(null);
  const [draftError, setDraftError] = useState<string>();
  const [inserted, setInserted] = useState(false);
  const [drafting, startDrafting] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [state, dispatch, pending] = useActionState<StaffReplyState, FormData>(async (previous, formData) => {
    const result = await sendStaffReply(submissionId, previous, formData);
    if (result.status === "sent") {
      setMessages((current) => merge(current, result.message));
      setReply("");
      setDraft(null);
      setInserted(false);
    }
    return result;
  }, { status: "idle" });

  useEffect(
    () =>
      subscribeAsUser((supabase) =>
        supabase
          .channel(`staff-thread-${threadId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
            (payload) => {
              const row = payload.new as MessageRow & { from_assistant: boolean };
              if (row.from_assistant) return;
              setMessages((current) => merge(current, toStaffThreadMessage(row, authorId, userId)));
            },
          ),
      ),
    [threadId, authorId, userId],
  );

  const suggest = () => {
    setDraftError(undefined);
    setInserted(false);
    startDrafting(async () => {
      const result = await suggestReply(submissionId);
      if (result.ok) setDraft(result.draft);
      else setDraftError(result.error);
    });
  };

  const insertDraft = () => {
    if (!draft) return;
    setReply((current) => (current.trim() ? `${current.trimEnd()}\n\n${draft.draft}` : draft.draft));
    setInserted(true);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      {messages.length === 0 && (
        <EmptyState title="Nie ma jeszcze wiadomości" headingLevel="h3">
          <p>Autor nie napisał jeszcze w tym wątku. Możesz odpowiedzieć na samo zgłoszenie.</p>
        </EmptyState>
      )}
      <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Wiadomości" className="empty:hidden">
        {messages.length > 0 && (
          <ol className="flex flex-col gap-4">
            {messages.map((message) => (
              <li key={message.id}>
                <ChatBubble
                  from={message.fromAuthor ? "them" : "me"}
                  author={authorLabel(message)}
                  meta={<time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </ChatBubble>
              </li>
            ))}
          </ol>
        )}
      </div>

      <section aria-labelledby="draft-heading" className="flex flex-col gap-3 border-t-2 border-border pt-6">
        <h3 id="draft-heading" className="text-h4">
          Szkic odpowiedzi od AI
        </h3>
        <p className="text-sm text-muted-foreground">
          AI przeczyta zgłoszenie i rozmowę, a potem zaproponuje odpowiedź z pasującymi innowacjami.
          Nic nie zostanie wysłane, dopóki nie klikniesz „Wyślij”.
        </p>
        <div>
          <Button type="button" variant="secondary" onClick={suggest} loading={drafting}>
            {!drafting && <Sparkles aria-hidden strokeWidth={2} />}
            {draft ? "Zaproponuj inną odpowiedź" : "Zaproponuj odpowiedź"}
          </Button>
        </div>

        <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
          {drafting && <AiThinking label="Piszę szkic odpowiedzi…" />}
          {draftError && !drafting && (
            <p role="alert" className="font-bold text-destructive">
              {draftError}
            </p>
          )}
          {draft && !drafting && (
            <AiHint targetType="reply_draft" targetId={submissionId}>
              <div className="flex flex-col gap-4">
                <p className="max-w-[68ch] whitespace-pre-wrap">{draft.draft}</p>
                {draft.innovations.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold">Pasujące innowacje</h4>
                    <ul className="flex flex-col gap-2">
                      {draft.innovations.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={`/library/${item.slug}`}
                            target="_blank"
                            className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                          >
                            {item.title}
                            <span className="sr-only"> (otwiera się w nowej karcie)</span>
                          </Link>
                          <p>{item.why}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <Button type="button" onClick={insertDraft}>
                    <CornerDownLeft aria-hidden strokeWidth={2} />
                    Wstaw do odpowiedzi
                  </Button>
                </div>
              </div>
            </AiHint>
          )}
        </div>
        <p role="status" className="font-bold empty:hidden">
          {inserted ? "Szkic jest w polu odpowiedzi. Popraw go i wyślij." : ""}
        </p>
      </section>

      <form action={dispatch} className="flex flex-col gap-4">
        <Field
          label="Odpowiedź ROPS"
          hint="Autor dostanie powiadomienie w serwisie i e-mailem, jeśli podał adres."
          error={state.status === "error" ? <span role="alert">{state.error}</span> : undefined}
        >
          <Textarea
            ref={textareaRef}
            name="body"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            maxLength={10000}
            rows={6}
            required
          />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" loading={pending}>
            {!pending && <Send aria-hidden strokeWidth={2} />}
            Wyślij
          </Button>
          <p role="status" className="font-bold text-success empty:hidden">
            {state.status === "sent" && !pending && !reply ? "Odpowiedź wysłana. Autor dostał powiadomienie." : ""}
          </p>
        </div>
      </form>
    </div>
  );
}
