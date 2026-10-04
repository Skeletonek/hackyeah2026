"use client"

import * as React from "react"
import { AnimatePresence, MotionConfig, motion, type Transition } from "motion/react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { AiThinking } from "@/components/ai/ai-thinking"

type ToolStep = {
  /** The first call's `toolCallId`: stays the same while the step runs and when it ends. */
  id: string
  label: string
  done: boolean
}

// Swaps of state, no overshoot: the steps should settle, not bounce.
const transition: Transition = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
  opacity: { duration: 0.2, ease: "easeOut" },
}

const enter = { opacity: 0, y: 8 }
const shown = { opacity: 1, y: 0 }
const swap = { opacity: 0, scale: 0.96 }
const swapped = { opacity: 1, scale: 1 }

function pluralSteps(count: number) {
  if (count === 1) return "1 krok"
  const tens = count % 100
  const units = count % 10
  return units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? `${count} kroki` : `${count} kroków`
}

function DoneChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      data-slot="tool-step-done"
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-sm text-success kontrast:border-2 kontrast:border-success simple:text-simple-sm",
        className
      )}
    >
      <Check aria-hidden className="size-5 shrink-0" strokeWidth={2} />
      {label}
    </span>
  )
}

/**
 * What the assistant does during a reply, one row per step. A running step
 * reads like `AiThinking`; when it ends it turns into a done chip in place and
 * stays, so the progress never blinks between tool calls. `thinking` adds a
 * last row while the model decides what to do next.
 *
 * Reduced motion keeps the fades and drops the movement.
 */
function ToolSteps({ steps, thinking }: { steps: ToolStep[]; thinking: boolean }) {
  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      <ol aria-label="Kroki asystenta" className="relative flex flex-col items-start gap-2 empty:hidden">
        <AnimatePresence mode="popLayout">
          {steps.map((step) => (
            <motion.li
              key={step.id}
              layout="position"
              initial={enter}
              animate={shown}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {step.done ? (
                  <motion.div key="done" initial={swap} animate={swapped} exit={swap}>
                    <DoneChip label={step.label} />
                  </motion.div>
                ) : (
                  <motion.div key="running" initial={swap} animate={swapped} exit={swap}>
                    <AiThinking label={step.label} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          ))}
          {thinking && (
            <motion.li key="thinking" layout="position" initial={enter} animate={shown} exit={{ opacity: 0 }}>
              <AiThinking />
            </motion.li>
          )}
        </AnimatePresence>
      </ol>
    </MotionConfig>
  )
}

/** The steps of a finished reply, folded into one line so the answer comes first. */
function ToolStepsSummary({ steps }: { steps: ToolStep[] }) {
  return (
    <details data-slot="tool-steps-summary" className="group w-fit">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border-2 border-input bg-card px-4 text-sm font-bold text-foreground hover:border-foreground hover:bg-muted simple:min-h-16 simple:px-5 simple:text-simple-sm [&::-webkit-details-marker]:hidden">
        <Check aria-hidden className="size-5 shrink-0 text-success" strokeWidth={2} />
        Asystent wykonał {pluralSteps(steps.length)}
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
          strokeWidth={2}
        />
      </summary>
      <ol className="mt-3 flex flex-col items-start gap-2">
        {steps.map((step) => (
          <li key={step.id}>
            <DoneChip label={step.label} />
          </li>
        ))}
      </ol>
    </details>
  )
}

export { ToolSteps, ToolStepsSummary, type ToolStep }
