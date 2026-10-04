"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsWide } from "./use-is-wide";

type Selected = { id: string; title: string; description: string };

/**
 * The preview pane of the inbox. From `xl` it is the column beside the list.
 * Below `xl` the selected submission opens in a bottom sheet, so clicking a row
 * shows it at once instead of somewhere under the list. Without JavaScript (and
 * before hydration) the pane renders in the page flow, under the list.
 */
export function PreviewDrawer({
  selected,
  closeHref,
  children,
}: {
  selected: Selected | null;
  /** The inbox URL with the current filters and no `selected`. */
  closeHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const isWide = useIsWide();

  // The sheet closes at once; the URL catches up after `router.replace`.
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  if (!selected && dismissedId) setDismissedId(null);

  // Keep the last preview while the sheet slides out, after `selected` is gone.
  const [shown, setShown] = useState({ selected, children });
  if (selected && (shown.selected !== selected || shown.children !== children)) {
    setShown({ selected, children });
  }

  if (isWide === false) {
    const open = selected !== null && selected.id !== dismissedId;
    const returnFocusTo = shown.selected?.id;

    return (
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next || !selected) return;
          setDismissedId(selected.id);
          router.replace(closeHref, { scroll: false });
        }}
      >
        <SheetContent
          side="bottom"
          tabIndex={-1}
          className={cn(
            "focus-visible:shadow-none",
            "[&_[data-slot=submission-preview]]:border-0 [&_[data-slot=submission-preview]]:p-0",
            "[&_[data-slot=submission-preview-header]]:pr-12",
            // The actions stay in reach while the description scrolls.
            "[&_[data-slot=submission-preview-footer]]:sticky [&_[data-slot=submission-preview-footer]]:-bottom-6 [&_[data-slot=submission-preview-footer]]:bg-card [&_[data-slot=submission-preview-footer]]:pb-6",
          )}
          onOpenAutoFocus={(event) => {
            // Start on the sheet itself, so a screen reader reads the title and
            // the preview from the top instead of jumping to its first button.
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
          onCloseAutoFocus={(event) => {
            // The list re-renders after the URL change, so find the row link
            // again rather than trusting the element focused before opening.
            const row = document.querySelector<HTMLElement>(
              `[data-submission-id="${returnFocusTo}"]`,
            );
            if (!row) return;
            event.preventDefault();
            row.focus();
          }}
        >
          <SheetTitle className="sr-only">{shown.selected?.title}</SheetTitle>
          <SheetDescription className="sr-only">{shown.selected?.description}</SheetDescription>
          {shown.children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <section aria-labelledby="preview-pane-heading" className="flex flex-col gap-3">
      <h2 id="preview-pane-heading" className="sr-only">
        Podgląd zgłoszenia
      </h2>
      {children}
    </section>
  );
}
