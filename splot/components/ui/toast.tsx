"use client"

import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Toaster as Sonner, toast as sonnerToast } from "sonner"

import { cn } from "@/lib/utils"
import { TONES, type Tone } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const ICON_TONES: Record<Tone, string> = {
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
}

type ToastAction = { label: string } & ({ href: string } | { onClick: () => void })

type ToastOptions = {
  tone?: Tone
  title: string
  description?: string
  /** A toast with an action stays until closed; without one it leaves after 8 s. */
  action?: ToastAction
}

/** Mounted once in the root layout. */
function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      // Every toast stays readable; a collapsed stack hides the older ones.
      expand
      containerAriaLabel="Powiadomienia"
      style={{ "--width": "28rem" } as React.CSSProperties}
    />
  )
}

function toast({ tone = "info", title, description, action }: ToastOptions) {
  return sonnerToast.custom(
    (id) => (
      <ToastCard
        tone={tone}
        title={title}
        description={description}
        action={action}
        onClose={() => sonnerToast.dismiss(id)}
      />
    ),
    { duration: action ? Infinity : 8000 }
  )
}

function ToastCard({
  tone,
  title,
  description,
  action,
  onClose,
}: Required<Pick<ToastOptions, "tone" | "title">> &
  Pick<ToastOptions, "description" | "action"> & { onClose: () => void }) {
  const { icon: Icon, label } = TONES[tone]

  return (
    <div
      data-slot="toast"
      className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border border-border bg-card py-4 pr-2 pl-4 font-sans text-base text-card-foreground shadow-lg kontrast:border-2 sm:w-(--width)"
    >
      <span className={cn("grid size-11 place-items-center rounded-full", ICON_TONES[tone])}>
        <Icon aria-hidden className="size-6" strokeWidth={2} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-bold">
          <span className="sr-only">{label}: </span>
          {title}
        </p>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        {action && (
          <div className="mt-3">
            {"href" in action ? (
              <Button asChild variant="outline" size="sm">
                <Link href={action.href} onClick={onClose}>
                  {action.label}
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  action.onClick()
                  onClose()
                }}
              >
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} className="text-foreground kontrast:border-transparent">
        <X aria-hidden strokeWidth={2} />
        <span className="sr-only">Zamknij powiadomienie</span>
      </Button>
    </div>
  )
}

export { Toaster, toast, type ToastOptions }
