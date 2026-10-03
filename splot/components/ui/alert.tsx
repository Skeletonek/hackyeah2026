import * as React from "react"
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

/** Icon + spoken label per tone, so colour is never the only carrier. */
const TONES = {
  info: { icon: Info, label: "Informacja", className: "border-info bg-info-soft text-info" },
  success: {
    icon: CircleCheck,
    label: "Gotowe",
    className: "border-success bg-success-soft text-success",
  },
  warning: {
    icon: TriangleAlert,
    label: "Uwaga",
    className: "border-warning bg-warning-soft text-warning",
  },
  error: { icon: CircleAlert, label: "Błąd", className: "border-error bg-error-soft text-error" },
}

type Tone = keyof typeof TONES

function Alert({
  tone = "info",
  title,
  action,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  tone?: Tone
  title: React.ReactNode
  /** Buttons or links under the text. */
  action?: React.ReactNode
}) {
  const { icon: Icon, label, className: toneClassName } = TONES[tone]

  return (
    <div
      data-slot="alert"
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "grid grid-cols-[auto_1fr] gap-3 rounded-md border-2 px-6 py-4",
        toneClassName,
        className
      )}
      {...props}
    >
      <Icon aria-hidden className="mt-0.5 size-7 shrink-0" strokeWidth={2} />
      <div className="grid min-w-0 gap-1">
        <p className="font-bold">
          <span className="sr-only">{label}: </span>
          {title}
        </p>
        {children && <div className="text-foreground">{children}</div>}
        {action && <div className="mt-2 flex flex-wrap gap-3">{action}</div>}
      </div>
    </div>
  )
}

export { Alert, TONES, type Tone }
