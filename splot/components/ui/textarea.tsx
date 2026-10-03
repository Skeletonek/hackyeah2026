"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useFieldControl } from "@/components/ui/field"
import { controlClassName } from "@/components/ui/input"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlClassName, "block min-h-32 resize-y simple:min-h-40", className)}
      {...useFieldControl(props)}
    />
  )
}

export { Textarea }
