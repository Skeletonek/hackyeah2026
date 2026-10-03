"use client"

import * as React from "react"
import { Flag, ThumbsDown, ThumbsUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { submitAiFeedback } from "@/lib/ai/feedback-actions"
import { AiBadge } from "@/components/ai/ai-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"

type Rating = -1 | 1

/**
 * Wraps every AI text: the „Podpowiedź AI” badge, 👍/👎 and „Zgłoś błąd”.
 * Feedback lands in `ai_feedback` under `targetType` + `targetId`.
 */
function AiHint({
  targetType,
  targetId,
  feedback = true,
  framed = true,
  className,
  children,
}: {
  /** What is rated, e.g. `conversation_message`, `match_reason`, `easy_read`. */
  targetType: string
  targetId: string
  /** Hide the reactions, e.g. while the text is still streaming. */
  feedback?: boolean
  /** Draw the AI background; turn off inside a `ChatBubble`, which has its own. */
  framed?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="ai-hint"
      className={cn(
        "flex flex-col gap-3",
        framed &&
          "rounded-lg bg-accent p-5 text-accent-foreground kontrast:border-2 kontrast:border-accent-foreground",
        className
      )}
    >
      <AiBadge className={cn(!framed && "bg-card/70")} />
      <div className="min-w-0">{children}</div>
      {feedback && <AiFeedback targetType={targetType} targetId={targetId} />}
    </div>
  )
}

function AiFeedback({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [rating, setRating] = React.useState<Rating | null>(null)
  const [pending, startTransition] = React.useTransition()
  const labelId = React.useId()

  const rate = (value: Rating) => {
    const previous = rating
    setRating(value)
    startTransition(async () => {
      const result = await submitAiFeedback({ targetType, targetId, rating: value })
      if ("error" in result) {
        setRating(previous)
        toast({ tone: "error", title: result.error })
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t-2 border-current/15 pt-2 text-sm simple:text-simple-sm">
      <span id={labelId} className="mr-1">
        Czy to pomocne?
      </span>
      <div role="group" aria-labelledby={labelId} className="flex gap-1">
        <RateButton
          label="Tak, pomocne"
          pressed={rating === 1}
          disabled={pending}
          onClick={() => rate(1)}
        >
          <ThumbsUp aria-hidden strokeWidth={2} />
        </RateButton>
        <RateButton
          label="Nie, niepomocne"
          pressed={rating === -1}
          disabled={pending}
          onClick={() => rate(-1)}
        >
          <ThumbsDown aria-hidden strokeWidth={2} />
        </RateButton>
      </div>
      <ReportDialog targetType={targetType} targetId={targetId} />
      <p role="status" className="basis-full font-bold empty:hidden">
        {rating !== null && !pending ? "Dziękujemy za ocenę." : ""}
      </p>
    </div>
  )
}

function RateButton({
  label,
  pressed,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string; pressed: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={pressed}
      className="text-current aria-pressed:bg-primary aria-pressed:text-primary-foreground"
      {...props}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

function ReportDialog({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [open, setOpen] = React.useState(false)
  const [comment, setComment] = React.useState("")
  const [error, setError] = React.useState<string>()
  const [pending, startTransition] = React.useTransition()

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!comment.trim()) {
      setError("Opisz błąd w co najmniej jednym zdaniu.")
      return
    }
    startTransition(async () => {
      const result = await submitAiFeedback({ targetType, targetId, rating: -1, comment })
      if ("error" in result) {
        setError(result.fieldErrors?.comment?.[0] ?? result.error)
        return
      }
      setOpen(false)
      setComment("")
      setError(undefined)
      toast({ tone: "success", title: "Dziękujemy. Sprawdzimy tę podpowiedź." })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="text-current">
          <Flag aria-hidden strokeWidth={2} className="size-5" />
          Zgłoś błąd
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>Zgłoś błąd w podpowiedzi AI</DialogTitle>
            <DialogDescription>Zgłoszenie trafi do zespołu ROPS.</DialogDescription>
          </DialogHeader>
          <Field
            label="Co jest nie tak?"
            hint="Na przykład błędna informacja albo rozwiązanie, które nie pasuje."
            error={error}
          >
            <Textarea
              name="comment"
              value={comment}
              maxLength={2000}
              onChange={(event) => setComment(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Anuluj</Button>
            </DialogClose>
            <Button type="submit" loading={pending}>
              Wyślij zgłoszenie
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { AiHint }
