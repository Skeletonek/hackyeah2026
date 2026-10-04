"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * The AI follow-up question: one question, large answer buttons and
 * „Pomiń”. Once answered it stays on screen, read-only, with the choice marked.
 */
function QuickReplies({
  question,
  options,
  allowSkip = true,
  answer,
  onAnswer,
  className,
}: {
  question: string
  options: string[]
  allowSkip?: boolean
  /** The chosen option, or `null` when skipped; `undefined` while unanswered. */
  answer?: string | null
  /** Called with the option, or `null` for „Pomiń”. */
  onAnswer?: (answer: string | null) => void
  className?: string
}) {
  const questionId = React.useId()
  const answered = answer !== undefined

  return (
    <div
      data-slot="quick-replies"
      role="group"
      aria-labelledby={questionId}
      className={cn("flex flex-col gap-3", className)}
    >
      <p id={questionId} className="text-h4 font-bold simple:text-simple-h4">
        {question}
      </p>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const chosen = answered && answer === option
          return (
            <Button
              key={option}
              variant={chosen ? "default" : "outline"}
              size="lg"
              disabled={answered && !chosen}
              aria-pressed={answered ? chosen : undefined}
              onClick={answered ? undefined : () => onAnswer?.(option)}
              // `Button` never shrinks, so a long option is capped to the row and wraps.
              className={cn("max-w-full whitespace-normal text-left", chosen && "pointer-events-none")}
            >
              {chosen && <Check aria-hidden strokeWidth={2} />}
              {option}
            </Button>
          )
        })}
        {allowSkip && !answered && (
          <Button variant="ghost" size="lg" onClick={() => onAnswer?.(null)}>
            Pomiń
          </Button>
        )}
      </div>
      {answered && answer === null && (
        <p className="text-muted-foreground">Pominięto pytanie.</p>
      )}
    </div>
  )
}

export { QuickReplies }
