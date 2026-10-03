"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  Dialog as Sheet,
  DialogClose as SheetClose,
  DialogCloseButton,
  DialogDescription as SheetDescription,
  DialogFooter as SheetFooter,
  DialogHeader as SheetHeader,
  DialogOverlay,
  DialogTitle as SheetTitle,
  DialogTrigger as SheetTrigger,
} from "@/components/ui/dialog"

const SIDES = {
  right:
    "inset-y-0 right-0 w-full max-w-md rounded-l-lg data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right kontrast:border-l-2",
  left: "inset-y-0 left-0 w-full max-w-md rounded-r-lg data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left kontrast:border-r-2",
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-lg data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom kontrast:border-t-2",
}

/** A dialog that slides in from an edge; shares its parts with `Dialog`. */
function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: keyof typeof SIDES }) {
  return (
    <SheetPrimitive.Portal>
      <DialogOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 overflow-y-auto bg-card p-6 text-card-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in kontrast:border-border",
          SIDES[side],
          className
        )}
        {...props}
      >
        {children}
        <DialogCloseButton />
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
