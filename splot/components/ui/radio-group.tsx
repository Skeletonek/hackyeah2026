import * as React from "react"

import { cn } from "@/lib/utils"
import { FieldError, FieldHint } from "@/components/ui/field"

type RadioOption = {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
}

const dotClassName =
  "peer size-7 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-input bg-card checked:border-primary checked:bg-[radial-gradient(circle,var(--primary)_0_42%,var(--card)_46%)] hover:border-foreground disabled:cursor-not-allowed disabled:border-dashed disabled:border-input disabled:bg-muted simple:size-9"

/**
 * Native radios in a `<fieldset>`. `variant="cards"` turns each answer into a
 * large 64 px card (the AI follow-up question).
 */
function RadioGroup({
  legend,
  hint,
  error,
  name,
  options,
  variant = "default",
  value,
  defaultValue,
  onValueChange,
  required,
  className,
}: {
  legend: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  name: string
  options: RadioOption[]
  variant?: "default" | "cards"
  /** Controlled value; pair with `onValueChange`. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  required?: boolean
  className?: string
}) {
  const groupId = React.useId()
  const hintId = hint ? `${groupId}-hint` : undefined
  const errorId = error ? `${groupId}-error` : undefined
  const cards = variant === "cards"

  return (
    <fieldset
      data-slot="radio-group"
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      className={cn("grid min-w-0 gap-2", className)}
    >
      <legend className="mb-2 p-0 text-base font-bold simple:text-simple-base">{legend}</legend>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <div className={cn("grid", cards ? "gap-3" : "gap-1")}>
        {options.map((option, index) => {
          const optionId = `${groupId}-${index}`
          const descriptionId = option.description ? `${optionId}-description` : undefined
          const input = (
            <input
              type="radio"
              id={optionId}
              name={name}
              value={option.value}
              checked={value === undefined ? undefined : value === option.value}
              defaultChecked={value === undefined ? defaultValue === option.value : undefined}
              onChange={onValueChange ? () => onValueChange(option.value) : undefined}
              disabled={option.disabled}
              required={required}
              aria-describedby={descriptionId}
              className={cn(
                dotClassName,
                error && "border-destructive",
                cards && "absolute top-1/2 left-6 -translate-y-1/2 focus-visible:shadow-none"
              )}
            />
          )
          const description = option.description && (
            <span
              id={descriptionId}
              className="text-sm font-normal text-muted-foreground simple:text-simple-sm"
            >
              {option.description}
            </span>
          )

          return cards ? (
            <div key={option.value} className="relative">
              {input}
              <label
                htmlFor={optionId}
                className="flex min-h-16 cursor-pointer flex-col justify-center gap-0.5 rounded-lg border-2 border-input bg-card py-3 pr-6 pl-17 text-h4 font-bold peer-checked:border-3 peer-checked:border-primary peer-checked:bg-secondary peer-checked:text-secondary-foreground peer-hover:border-foreground peer-focus-visible:focus-ring peer-disabled:cursor-not-allowed peer-disabled:border-dashed peer-disabled:bg-muted peer-disabled:text-muted-foreground hover:border-foreground simple:min-h-20 simple:pl-19 simple:text-simple-base"
              >
                <span>{option.label}</span>
                {description}
              </label>
            </div>
          ) : (
            <div
              key={option.value}
              className="grid min-h-11 grid-cols-[auto_1fr] items-start gap-x-3 py-2 simple:min-h-16 simple:py-3.5"
            >
              {input}
              <label
                htmlFor={optionId}
                className="grid cursor-pointer gap-0.5 peer-disabled:cursor-not-allowed peer-disabled:text-muted-foreground"
              >
                <span>{option.label}</span>
                {description}
              </label>
            </div>
          )
        })}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  )
}

export { RadioGroup, type RadioOption }
