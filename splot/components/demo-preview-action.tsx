"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Replaces a real action button on C6 demo screens.
 *
 * Instead of performing the action, it opens a Dialog explaining that the
 * feature is a preview. This satisfies the acceptance criterion:
 * "interactive controls are disabled with an explanation, or open a Dialog
 * saying the same".
 */
function DemoPreviewAction({
  children,
  label = "Dowiedz się więcej",
  variant = "default",
  size = "default",
}: {
  children?: React.ReactNode;
  label?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Funkcja w przygotowaniu</DialogTitle>
          <DialogDescription>Podgląd — ta funkcja pojawi się w kolejnej wersji.</DialogDescription>
        </DialogHeader>
        {children && <div className="text-foreground">{children}</div>}
      </DialogContent>
    </Dialog>
  );
}

export { DemoPreviewAction };
