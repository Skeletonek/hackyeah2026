import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { FieldError } from "@/components/ui/field"

/** Native checkbox with its own label, optional description and error. */
function Checkbox({
  label,
  description,
  error,
  id,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  label: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
}) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div
      data-slot="checkbox"
      className={cn(
        "grid min-h-11 grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 py-2 simple:min-h-16 simple:py-3.5",
        className
      )}
    >
      <input
        type="checkbox"
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
        className="peer col-start-1 row-start-1 size-7 cursor-pointer appearance-none rounded-sm border-2 border-input bg-card checked:border-primary checked:bg-primary hover:border-foreground disabled:cursor-not-allowed disabled:border-dashed disabled:border-input disabled:bg-muted aria-invalid:border-3 aria-invalid:border-destructive simple:size-9"
        {...props}
      />
      <Check
        aria-hidden
        className="pointer-events-none col-start-1 row-start-1 mt-1 size-5 justify-self-center text-primary-foreground opacity-0 peer-checked:opacity-100 peer-disabled:text-muted-foreground simple:mt-1.5 simple:size-6"
        strokeWidth={3}
      />
      <label
        htmlFor={inputId}
        className="grid cursor-pointer gap-0.5 peer-disabled:cursor-not-allowed peer-disabled:text-muted-foreground"
      >
        <span>{label}</span>
        {description && (
          <span id={descriptionId} className="text-sm text-muted-foreground simple:text-simple-sm">
            {description}
          </span>
        )}
      </label>
      {error && (
        <FieldError id={errorId} className="col-start-2">
          {error}
        </FieldError>
      )}
    </div>
  )
}

export { Checkbox }
