"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { ChatBubble } from "@/components/ai/chat-bubble";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { subscribeAsUser } from "@/lib/supabase/realtime";
import { toThreadMessage, type MessageRow, type ThreadMessage } from "@/lib/threads/messages";
import { sendReply, type ReplyState } from "../actions";

/** Adds messages once, whichever arrives first: the action's result or the Realtime event. */
function merge(current: ThreadMessage[], incoming: ThreadMessage): ThreadMessage[] {
  if (current.some((message) => message.id === incoming.id)) return current;
  return [...current, incoming].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * KOM2: the conversation with ROPS under the status. New messages arrive over
 * Realtime (RLS limits them to thread participants); a status change refreshes
 * the server-rendered timeline above.
 */
export function SubmissionThread({
  submissionId,
  threadId,
  userId,
  initialMessages,
}: {
  submissionId: string;
  threadId: string;
  userId: string;
  initialMessages: ThreadMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  const [state, dispatch, pending] = useActionState<ReplyState, FormData>(async (previous, formData) => {
    const result = await sendReply(submissionId, previous, formData);
    if (result.status === "sent") {
      setMessages((current) => merge(current, result.message));
      setDraft("");
    }
    return result;
  }, { status: "idle" });

  useEffect(
    () =>
      subscribeAsUser((supabase) =>
        supabase
          .channel(`submission-thread-${threadId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
            (payload) => {
              const row = payload.new as MessageRow & { from_assistant: boolean };
              // AI hints in a thread are for the people answering, not for the author.
              if (row.from_assistant) return;
              setMessages((current) => merge(current, toThreadMessage(row, userId)));
            },
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "submissions", filter: `id=eq.${submissionId}` },
            () => router.refresh(),
          ),
      ),
    [router, submissionId, threadId, userId],
  );

  return (
    <div className="flex flex-col gap-6">
      {messages.length === 0 && (
        <EmptyState title="Nie ma jeszcze wiadomości" headingLevel="h3">
          <p>Gdy ROPS odpowie, wiadomość pojawi się tutaj. Możesz też napisać pierwszy.</p>
        </EmptyState>
      )}
      <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Wiadomości" className="empty:hidden">
        {messages.length > 0 && (
          <ol className="flex flex-col gap-4">
            {messages.map((message) => (
              <li key={message.id}>
                <ChatBubble
                  from={message.isOwn ? "me" : "them"}
                  author={message.isOwn ? "Ty" : "ROPS"}
                  meta={<time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </ChatBubble>
              </li>
            ))}
          </ol>
        )}
      </div>

      <form action={dispatch} className="flex flex-col gap-4">
        <input type="hidden" name="threadId" value={threadId} />
        <Field
          label="Twoja wiadomość"
          hint="ROPS odpowiada zwykle w ciągu 2 dni roboczych."
          error={state.status === "error" ? <span role="alert">{state.error}</span> : undefined}
        >
          <Textarea
            name="body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={10000}
            rows={4}
            required
          />
        </Field>
        <Button type="submit" size="lg" loading={pending} className="self-start">
          {!pending && <Send aria-hidden strokeWidth={2} />}
          Wyślij
        </Button>
      </form>
    </div>
  );
}
