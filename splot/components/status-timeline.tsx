import { Check, CircleDot } from "lucide-react";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/lib/labels";
import { cn } from "@/lib/utils";

const STEPS = ["received", "in_review", "answered", "closed"] as const satisfies SubmissionStatus[];

/** The expert flow is not a step of its own: the author sees „W ocenie”. */
function stepOf(status: SubmissionStatus): (typeof STEPS)[number] {
  return status === "with_expert" ? "in_review" : status;
}

const STATES = {
  done: { label: "Zrobione", className: "border-primary" },
  current: { label: "Teraz", className: "border-primary" },
  todo: { label: "Jeszcze przed nami", className: "border-dashed border-input text-muted-foreground" },
};

/**
 * Where a submission is: Przyjęte → W ocenie → Odpowiedź → Zakończone.
 * Shows the current step only, without per-step dates.
 */
export function StatusTimeline({
  status,
  className,
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  const currentIndex = STEPS.indexOf(stepOf(status));

  return (
    <ol
      data-slot="status-timeline"
      aria-label="Status zgłoszenia"
      className={cn("grid gap-0 sm:grid-cols-4 sm:gap-2 simple:sm:grid-cols-1 simple:sm:gap-0", className)}
    >
      {STEPS.map((step, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
        const { label, className: stateClassName } = STATES[state];

        return (
          <li
            key={step}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 border-l-4 py-3 pl-4 sm:flex-col sm:items-start sm:gap-2 sm:border-t-4 sm:border-l-0 sm:pt-4 sm:pl-0 simple:sm:flex-row simple:sm:items-center simple:sm:gap-3 simple:sm:border-t-0 simple:sm:border-l-4 simple:sm:py-3 simple:sm:pl-4",
              stateClassName,
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full border-2",
                state === "done" && "border-primary bg-primary text-primary-foreground",
                state === "current" && "border-primary bg-card text-primary",
                state === "todo" && "border-dashed border-input bg-card",
              )}
            >
              {state === "done" && <Check className="size-6" strokeWidth={2} />}
              {state === "current" && <CircleDot className="size-6" strokeWidth={2} />}
            </span>
            <span className="flex flex-col">
              <span className={cn(state === "current" ? "text-h4 font-bold simple:text-simple-h4" : "font-bold")}>
                {SUBMISSION_STATUS_LABELS[step]}
              </span>
              <span className={cn("text-sm simple:text-simple-sm", state !== "current" && "sr-only")}>{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
