import * as React from "react"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

/** Marks text written by AI. Always paired with a way to react (see `AiHint`). */
function AiBadge({ className, children = "Podpowiedź AI", ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="ai-badge"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground kontrast:border-2 kontrast:border-accent-foreground simple:text-simple-sm",
        className
      )}
      {...props}
    >
      <Sparkles aria-hidden className="size-5 shrink-0" strokeWidth={2} />
      {children}
    </span>
  )
}

export { AiBadge }
