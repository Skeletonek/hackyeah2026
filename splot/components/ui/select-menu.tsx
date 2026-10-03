"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * shadcn `Select` (Radix) in Splot tokens: a styled listbox for controls that
 * act on change, e.g. the text size in A11yToolbar. Form fields keep the
 * native `Select` from `ui/select`.
 */
const SelectMenu = SelectPrimitive.Root
const SelectMenuValue = SelectPrimitive.Value

function SelectMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-menu-trigger"
      className={cn(
        "inline-flex min-h-13 cursor-pointer items-center justify-between gap-2 rounded-md border-2 border-input bg-card px-4 py-2 text-left text-base text-foreground hover:border-foreground disabled:cursor-not-allowed disabled:border-dashed disabled:bg-muted disabled:text-muted-foreground data-[placeholder]:text-muted-foreground simple:min-h-16 simple:text-simple-base [&>span]:truncate",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden className="size-5 shrink-0" strokeWidth={2} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectMenuContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-menu-content"
        position={position}
        sideOffset={4}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-x-hidden overflow-y-auto rounded-md border-2 border-border bg-popover text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/** 44 px row (64 px in simple mode); the highlighted row is the focus, so it carries no extra ring. */
function SelectMenuItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-menu-item"
      className={cn(
        "relative flex min-h-11 cursor-pointer items-center rounded-sm py-2 pr-10 pl-3 text-base outline-none select-none focus-visible:shadow-none data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground data-[state=checked]:font-bold kontrast:data-[highlighted]:bg-primary kontrast:data-[highlighted]:text-primary-foreground simple:min-h-16 simple:text-simple-base",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex items-center">
        <Check aria-hidden className="size-5" strokeWidth={2} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { SelectMenu, SelectMenuContent, SelectMenuItem, SelectMenuTrigger, SelectMenuValue }
