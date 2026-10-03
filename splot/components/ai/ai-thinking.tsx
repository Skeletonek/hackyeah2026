import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * „AI myśli”: progress in words, never a bare spinner. The three knots are
 * decorative; `role="status"` announces the label. Reduced motion stops the
 * pulse (globals.css), the text stays.
 */
function AiThinking({
  label = "Myślę nad odpowiedzią…",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** What is happening, e.g. „Przeglądam 100 innowacji…”. */
  label?: string
}) {
  return (
    <div
      data-slot="ai-thinking"
      role="status"
      className={cn(
        "flex w-fit items-center gap-3 rounded-xl rounded-tl-sm bg-accent px-5 py-3 text-accent-foreground kontrast:border-2 kontrast:border-accent-foreground",
        className
      )}
      {...props}
    >
      <span aria-hidden className="flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-2.5 animate-pulse rounded-full bg-current"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="font-bold">{label}</span>
    </div>
  )
}

export { AiThinking }
