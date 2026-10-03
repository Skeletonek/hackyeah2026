"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useFieldControl } from "@/components/ui/field"
import { controlClassName } from "@/components/ui/input"

/** Native `<select>`: the system picker is the most familiar one on phones and for screen readers. */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div data-slot="select" className="relative w-full min-w-0">
      <select
        className={cn(controlClassName, "cursor-pointer appearance-none pr-12", className)}
        {...useFieldControl(props)}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 size-6 -translate-y-1/2"
        strokeWidth={2}
      />
    </div>
  )
}

export { Select }
