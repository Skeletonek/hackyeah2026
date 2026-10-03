"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("grid gap-4", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex flex-wrap gap-x-1 border-b-2 border-border", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      // The active tab is marked by the thick underline, not by colour alone.
      className={cn(
        "-mb-0.5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-t-sm border-b-4 border-transparent px-4 font-bold text-muted-foreground hover:border-input hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 data-[state=active]:border-primary data-[state=active]:text-foreground simple:min-h-16 simple:px-5 simple:text-simple-base",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("rounded-sm", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
