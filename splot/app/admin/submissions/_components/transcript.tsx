import { Wrench } from "lucide-react";
import { AiHint } from "@/components/ai/ai-hint";
import { ChatBubble } from "@/components/ai/chat-bubble";
import type { TranscriptEntry } from "@/lib/admin/transcript";

/** „Rozmowa z asystentem”: read-only, text parts and one-line tool summaries. */
export function Transcript({
  entries,
  submissionId,
}: {
  entries: TranscriptEntry[];
  submissionId: string;
}) {
  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry, index) => (
        <li key={index}>
          {entry.kind === "tool" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench aria-hidden className="size-5 shrink-0" strokeWidth={2} />
              {entry.text}
            </p>
          ) : entry.from === "author" ? (
            <ChatBubble from="me" author="Autor zgłoszenia">
              <p className="whitespace-pre-line">{entry.text}</p>
            </ChatBubble>
          ) : (
            <ChatBubble from="ai" author="Asystent">
              <AiHint
                framed={false}
                feedback={false}
                targetType="submission_transcript"
                targetId={`${submissionId}:${index}`}
              >
                <p className="whitespace-pre-line">{entry.text}</p>
              </AiHint>
            </ChatBubble>
          )}
        </li>
      ))}
    </ol>
  );
}
