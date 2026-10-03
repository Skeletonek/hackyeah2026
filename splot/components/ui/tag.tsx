import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

const tagClassName =
  "inline-flex min-h-11 items-center gap-1 rounded-full border-2 text-sm font-bold simple:min-h-16 simple:text-simple-sm"

/**
 * Filter pill. As a toggle it carries `aria-pressed` and a ✓ when selected;
 * with `onRemove` it is an active filter with a „usuń” button.
 */
function Tag({
  selected = false,
  icon,
  onRemove,
  removeLabel,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean
  /** Shown when the tag is not selected. */
  icon?: React.ReactNode
  onRemove?: () => void
  /** Accessible name of the remove button; defaults to „Usuń filtr: {children}”. */
  removeLabel?: string
}) {
  if (onRemove) {
    return (
      <span
        data-slot="tag"
        className={cn(
          tagClassName,
          "border-secondary bg-secondary pl-4 text-secondary-foreground kontrast:border-secondary-foreground simple:pl-5",
          className
        )}
      >
        <span>{children}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={
            removeLabel ?? (typeof children === "string" ? `Usuń filtr: ${children}` : "Usuń filtr")
          }
          className="-my-0.5 -mr-0.5 grid size-11 cursor-pointer place-items-center rounded-full hover:bg-card simple:size-16"
        >
          <X aria-hidden className="size-5" strokeWidth={2} />
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      data-slot="tag"
      aria-pressed={selected}
      className={cn(
        tagClassName,
        "cursor-pointer border-input bg-card px-4 text-foreground hover:border-foreground hover:bg-muted disabled:cursor-not-allowed disabled:border-dashed disabled:border-input disabled:bg-muted disabled:text-muted-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground simple:px-5 [&_svg]:size-5 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {selected ? <Check aria-hidden strokeWidth={2} /> : icon}
      <span>{children}</span>
    </button>
  )
}

export { Tag }
