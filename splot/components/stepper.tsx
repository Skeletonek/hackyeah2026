import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = {
  label: string;
  /** Makes a finished step a link back to it. */
  href?: string;
};

/** Wizard progress with a known length: „Krok 2 z 4”. */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  /** 1-based number of the current step. */
  current: number;
  className?: string;
}) {
  return (
    <nav data-slot="stepper" aria-label="Kroki" className={cn("flex flex-col gap-3", className)}>
      <p className="font-bold simple:text-simple-base">
        Krok {current} z {steps.length}
        <span className="sm:hidden simple:inline!">: {steps[current - 1]?.label}</span>
      </p>
      <ol className="flex gap-2 simple:hidden">
        {steps.map((step, index) => {
          const number = index + 1;
          const state = number < current ? "done" : number === current ? "current" : "todo";
          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-primary bg-card text-primary",
                  state === "todo" && "border-dashed border-input bg-card text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-5" strokeWidth={2} /> : number}
              </span>
              <span className="max-sm:sr-only">
                <span className="sr-only">
                  Krok {number}
                  {state === "done" && ", zrobiony"}:{" "}
                </span>
                {step.label}
              </span>
            </>
          );

          return (
            <li
              key={step.label}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-1 border-t-4 pt-2 text-sm",
                state === "todo" ? "border-dashed border-input text-muted-foreground" : "border-primary",
                state === "current" && "font-bold",
              )}
            >
              {state === "done" && step.href ? (
                <Link
                  href={step.href}
                  className="flex min-h-11 min-w-11 items-center gap-2 rounded-md underline underline-offset-[0.2em] hover:decoration-[3px]"
                >
                  {content}
                </Link>
              ) : (
                <span className="flex min-h-11 items-center gap-2">{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
