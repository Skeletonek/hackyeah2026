import * as React from "react"

import { cn } from "@/lib/utils"

const FROM = {
  /** The reader's own message, on the right. */
  me: {
    align: "items-end",
    bubble: "rounded-tr-sm bg-secondary text-secondary-foreground kontrast:border-2 kontrast:border-secondary-foreground",
    label: "Ty",
  },
  /** A person (ROPS, mentor), on the left. */
  them: {
    align: "items-start",
    bubble: "rounded-tl-sm border-2 border-border bg-card text-card-foreground",
    label: "ROPS",
  },
  /** The assistant, on the left, on the AI background. */
  ai: {
    align: "items-start",
    bubble: "rounded-tl-sm bg-accent text-accent-foreground kontrast:border-2 kontrast:border-accent-foreground",
    label: "Asystent",
  },
}

type ChatBubbleFrom = keyof typeof FROM

/**
 * One chat message. Who wrote it is read out before the text, so the side
 * of the screen is never the only cue.
 */
function ChatBubble({
  from,
  author,
  meta,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  from: ChatBubbleFrom
  /** Shown above the bubble for people, e.g. „Anna, ROPS”; defaults to a screen-reader-only label. */
  author?: React.ReactNode
  /** Small line under the bubble, e.g. the time. */
  meta?: React.ReactNode
}) {
  const { align, bubble, label } = FROM[from]

  return (
    <div data-slot="chat-bubble" data-from={from} className={cn("flex flex-col gap-1", align, className)} {...props}>
      {author ? (
        <p className="px-1 text-sm font-bold text-muted-foreground simple:text-simple-sm">{author}</p>
      ) : (
        <span className="sr-only">{label}:</span>
      )}
      <div
        className={cn(
          "w-fit max-w-[min(100%,var(--measure))] rounded-xl px-5 py-3 break-words simple:px-6 simple:py-4",
          bubble
        )}
      >
        {children}
      </div>
      {meta && <p className="px-1 text-sm text-muted-foreground simple:text-simple-sm">{meta}</p>}
    </div>
  )
}

export { ChatBubble, type ChatBubbleFrom }
