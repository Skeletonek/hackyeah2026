"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useFieldControl } from "@/components/ui/field"

/** Shared look of Input, Textarea and Select: 52 px, 2 px border, 64 px in simple mode. */
const controlClassName =
  "min-h-13 w-full min-w-0 rounded-md border-2 border-input bg-card px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground hover:border-foreground disabled:cursor-not-allowed disabled:border-dashed disabled:border-input disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-3 aria-invalid:border-destructive simple:min-h-16 simple:text-simple-base"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input data-slot="input" className={cn(controlClassName, className)} {...useFieldControl(props)} />
  )
}

export { Input, controlClassName }
