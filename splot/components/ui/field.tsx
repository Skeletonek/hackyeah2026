"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

type FieldContextValue = {
  id: string
  describedBy: string | undefined
  invalid: boolean
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

/**
 * Label + hint + error around one control. `Input`, `Textarea` and `Select`
 * inside it pick up `id`, `aria-describedby` and `aria-invalid` on their own.
 */
function Field({
  label,
  hint,
  error,
  optional = false,
  id,
  className,
  children,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  /** Error text; also marks the control as invalid. */
  error?: React.ReactNode
  optional?: boolean
  /** Id of the control; generated when omitted. */
  id?: string
  className?: string
  children: React.ReactNode
}) {
  const generatedId = React.useId()
  const controlId = id ?? generatedId
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div data-slot="field" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={controlId} className="text-base font-bold simple:text-simple-base">
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (nieobowiązkowe)</span>
        )}
      </label>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <FieldContext value={{ id: controlId, describedBy, invalid: Boolean(error) }}>
        {children}
      </FieldContext>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-hint"
      className={cn("-mt-1 text-sm text-muted-foreground simple:text-simple-sm", className)}
      {...props}
    />
  )
}

function FieldError({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      className={cn(
        "flex items-start gap-2 text-sm font-bold text-destructive simple:text-simple-sm",
        className
      )}
      {...props}
    >
      <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
      <span>{children}</span>
    </p>
  )
}

/** Merges the surrounding `Field`'s id and ARIA wiring into a control's props. */
function useFieldControl<
  T extends {
    id?: string
    "aria-describedby"?: string
    "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  },
>(props: T): T {
  const field = React.useContext(FieldContext)
  if (!field) return props

  return {
    ...props,
    id: props.id ?? field.id,
    "aria-describedby":
      [props["aria-describedby"], field.describedBy].filter(Boolean).join(" ") || undefined,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
  }
}

export { Field, FieldHint, FieldError, useFieldControl }
