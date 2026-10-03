import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Focus comes from the global `:focus-visible` ring in globals.css.
const buttonVariants = cva(
  "inline-flex min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-transparent text-center font-bold transition-[background-color,border-color,transform] select-none active:translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted disabled:text-muted-foreground aria-busy:pointer-events-none aria-disabled:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:border-muted aria-disabled:bg-muted aria-disabled:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "bg-secondary text-secondary-foreground hover:border-primary kontrast:border-secondary-foreground",
        outline:
          "border-primary bg-card text-primary hover:bg-secondary hover:text-secondary-foreground",
        ghost:
          "text-primary hover:bg-secondary hover:text-secondary-foreground kontrast:border-secondary-foreground",
        saffron: "bg-saffron text-on-saffron hover:border-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:border-foreground",
        link: "text-primary underline underline-offset-[0.2em] hover:decoration-[3px]",
      },
      // Simple mode („Prościej”) lifts every control to 64 px.
      size: {
        sm: "min-h-11 px-4 py-1.5 text-sm simple:min-h-16 simple:px-8 simple:text-simple-base",
        default:
          "min-h-13 px-6 py-2 text-base simple:min-h-16 simple:px-8 simple:text-simple-base",
        lg: "min-h-16 px-8 py-2 text-h4 simple:text-simple-base",
        cta: "min-h-20 gap-3 rounded-lg px-8 py-3 text-[1.375rem]/7 simple:text-simple-h4 [&_svg:not([class*='size-'])]:size-8",
        icon: "size-11 simple:size-16",
      },
    },
    compoundVariants: [
      { variant: "link", size: ["sm", "default", "lg", "cta"], className: "px-2 simple:px-2" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner and sets `aria-busy`; ignored with `asChild`. */
    loading?: boolean
  }) {
  const classes = cn(buttonVariants({ variant, size, className }))

  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={classes} {...props}>
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      type="button"
      data-slot="button"
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-5 shrink-0 animate-spin rounded-full border-3 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  )
}

export { Button, buttonVariants }
