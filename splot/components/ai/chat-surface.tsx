"use client"

import * as React from "react"
import {
  getToolName,
  isToolUIPart,
  type ChatStatus,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai"
import { RotateCcw, SendHorizontal, Square } from "lucide-react"

import { cn } from "@/lib/utils"
import { AiHint } from "@/components/ai/ai-hint"
import { AiThinking } from "@/components/ai/ai-thinking"
import { ChatBubble } from "@/components/ai/chat-bubble"
import { QuickReplies } from "@/components/ai/quick-replies"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

type ToolPart = ToolUIPart | DynamicToolUIPart

/** Same call shape as `addToolOutput` from `useChat`, so it can be passed straight through. */
type AddToolOutput = (args: { tool: string; toolCallId: string; output: unknown }) => unknown

/** Shared client tool (`lib/ai/tools/`): rendered as `QuickReplies`. */
const ASK_QUESTION = "askQuestion"

type AskQuestionInput = { question?: string; options?: string[]; allowSkip?: boolean }

/** Messages sent by code, not typed by the reader (e.g. the first prompt), carry `metadata.auto`. */
function isAutoMessage(message: UIMessage) {
  const metadata = message.metadata as { auto?: unknown } | undefined
  return metadata?.auto === true
}

/**
 * Presentational chat: renders `UIMessage[]` from `useChat` / `useSkillChat`
 * and owns no transport. Streams render their own tool UI through
 * `renderToolPart`; any other tool shows `AiThinking` while it runs.
 *
 * Screen readers hear each message once, when it is finished: the message
 * that is still streaming sits outside the `role="log"` region.
 */
function ChatSurface({
  messages,
  status,
  onSend,
  onStop,
  onRetry,
  addToolOutput,
  renderToolPart = {},
  toolLabels = {},
  inputLabel = "Twoja wiadomość",
  inputHint,
  placeholder,
  inputAccessory,
  emptyState,
  feedbackTargetType = "conversation_message",
  className,
}: {
  messages: UIMessage[]
  status: ChatStatus
  onSend: (text: string) => void
  onStop: () => void
  /** Retry after a stream error, e.g. `regenerate` from `useChat`. */
  onRetry: () => void
  /** Answers client tools such as `askQuestion`; pass `addToolOutput` from `useChat`. */
  addToolOutput?: AddToolOutput
  /** Custom UI per tool name, e.g. `{ showMatches: (part) => <Results … /> }`. */
  renderToolPart?: Partial<Record<string, (part: ToolPart) => React.ReactNode>>
  /** What `AiThinking` says while a tool without a renderer runs, e.g. `{ searchInnovations: "Przeglądam 100 innowacji…" }`. */
  toolLabels?: Partial<Record<string, string>>
  inputLabel?: string
  inputHint?: string
  placeholder?: string
  /** Extra controls next to the send button, e.g. `MicButton`. */
  inputAccessory?: React.ReactNode
  /** Shown before the first message. */
  emptyState?: React.ReactNode
  /** `ai_feedback.target_type` for assistant messages. */
  feedbackTargetType?: string
  className?: string
}) {
  const [draft, setDraft] = React.useState("")
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const endRef = React.useRef<HTMLDivElement>(null)

  const waiting = status === "submitted"
  const busy = waiting || status === "streaming"
  const visible = messages.filter((message) => message.role !== "system" && !isAutoMessage(message))
  const last = visible.at(-1)
  const streamingMessage = status === "streaming" && last?.role === "assistant" ? last : undefined
  const settled = streamingMessage ? visible.slice(0, -1) : visible

  // Follow the conversation when a message is added, not on every token.
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" })
  }, [visible.length, waiting])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft("")
    inputRef.current?.focus()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) onStop()
    else send()
    inputRef.current?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      if (!busy) send()
    }
  }

  const renderMessage = (message: UIMessage, streaming: boolean) => (
    <MessageView
      key={message.id}
      message={message}
      streaming={streaming}
      busy={busy}
      addToolOutput={addToolOutput}
      renderToolPart={renderToolPart}
      toolLabels={toolLabels}
      feedbackTargetType={feedbackTargetType}
    />
  )

  return (
    <section data-slot="chat-surface" aria-label="Rozmowa z asystentem" className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-4">
        {visible.length === 0 && !busy && emptyState}
        <div role="log" aria-live="polite" aria-relevant="additions" className="flex flex-col gap-4 empty:hidden">
          {settled.map((message) => renderMessage(message, false))}
        </div>
        {streamingMessage && renderMessage(streamingMessage, true)}
        {waiting && <AiThinking />}
        <div ref={endRef} />
      </div>

      {status === "error" && (
        <Alert
          tone="error"
          title="Coś poszło nie tak."
          action={
            <Button variant="outline" onClick={onRetry} className="max-w-full">
              <RotateCcw aria-hidden strokeWidth={2} />
              Spróbuj ponownie
            </Button>
          }
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label={inputLabel} hint={inputHint}>
          <Textarea
            ref={inputRef}
            name="message"
            rows={2}
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-24 simple:min-h-32"
          />
        </Field>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {inputAccessory}
          {busy ? (
            <Button type="submit" variant="outline">
              <Square aria-hidden strokeWidth={2} />
              Zatrzymaj
            </Button>
          ) : (
            <Button type="submit" disabled={!draft.trim()}>
              <SendHorizontal aria-hidden strokeWidth={2} />
              Wyślij
            </Button>
          )}
        </div>
      </form>
    </section>
  )
}

function MessageView({
  message,
  streaming,
  busy,
  addToolOutput,
  renderToolPart,
  toolLabels,
  feedbackTargetType,
}: {
  message: UIMessage
  streaming: boolean
  busy: boolean
  addToolOutput?: AddToolOutput
  renderToolPart: Partial<Record<string, (part: ToolPart) => React.ReactNode>>
  toolLabels: Partial<Record<string, string>>
  feedbackTargetType: string
}) {
  if (message.role === "user") {
    const text = message.parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n\n")
    if (!text) return null
    return (
      <ChatBubble from="me">
        <p className="whitespace-pre-line">{text}</p>
      </ChatBubble>
    )
  }

  const lastIndex = message.parts.length - 1

  return (
    <div data-message-id={message.id} className="flex flex-col gap-4">
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`

        if (part.type === "text") {
          if (!part.text.trim()) return null
          const typing = part.state === "streaming" || (streaming && index === lastIndex)
          return (
            <ChatBubble key={key} from="ai">
              <AiHint
                framed={false}
                feedback={!typing}
                targetType={feedbackTargetType}
                targetId={`${message.id}:${index}`}
              >
                <p className="whitespace-pre-line">
                  {part.text}
                  {typing && (
                    <span aria-hidden className="ml-0.5 animate-pulse motion-reduce:hidden">
                      ▍
                    </span>
                  )}
                </p>
              </AiHint>
            </ChatBubble>
          )
        }

        if (!isToolUIPart(part)) return null

        const name = getToolName(part)
        const render = renderToolPart[name]
        if (render) return <React.Fragment key={key}>{render(part)}</React.Fragment>

        if (name === ASK_QUESTION) {
          return <AskQuestionPart key={key} part={part} addToolOutput={addToolOutput} />
        }

        const running = part.state === "input-streaming" || part.state === "input-available"
        if (!running || !busy) return null
        return <AiThinking key={key} label={toolLabels[name] ?? part.title ?? "Pracuję nad odpowiedzią…"} />
      })}
    </div>
  )
}

function AskQuestionPart({ part, addToolOutput }: { part: ToolPart; addToolOutput?: AddToolOutput }) {
  const input = (part.input ?? {}) as AskQuestionInput

  if (part.state === "input-streaming" || !input.question || !input.options?.length) {
    return part.state === "output-error" ? null : <AiThinking label="Przygotowuję pytanie…" />
  }
  if (part.state === "output-error") return null

  const answered = part.state === "output-available"
  const output = answered ? part.output : undefined

  return (
    <ChatBubble from="ai">
      <AiHint framed={false} feedback={false} targetType="ask_question" targetId={part.toolCallId}>
        <QuickReplies
          question={input.question}
          options={input.options}
          allowSkip={input.allowSkip ?? true}
          answer={answered ? (typeof output === "string" ? output : null) : undefined}
          onAnswer={(answer) =>
            addToolOutput?.({ tool: getToolName(part), toolCallId: part.toolCallId, output: answer })
          }
        />
      </AiHint>
    </ChatBubble>
  )
}

export { ChatSurface, type ToolPart, type AddToolOutput }
