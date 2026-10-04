"use client";

import { Children, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** How many items a list shows in simple mode before „Pokaż wszystkie”. */
const SIMPLE_MODE_ITEMS = 3;

/**
 * A list that simple mode („Prościej”) caps at 3 items, with a button that
 * reveals the rest. Outside simple mode it is a plain `<ul>` / `<ol>`.
 */
export function CappedList({
  as = "ul",
  className,
  children,
  ...props
}: React.ComponentProps<"ul"> & { as?: "ul" | "ol" }) {
  // `<ol>` takes the same props here; one tag type keeps the ref simple.
  const Tag = as as "ul";
  const listRef = useRef<HTMLUListElement>(null);
  const [expanded, setExpanded] = useState(false);
  const count = Children.count(children);

  function showAll() {
    flushSync(() => setExpanded(true));
    // The button is gone now; continue from the first item it revealed.
    const item = listRef.current?.children[SIMPLE_MODE_ITEMS];
    if (!(item instanceof HTMLElement)) return;
    const control = item.querySelector<HTMLElement>("a[href], button");
    if (!control) item.tabIndex = -1;
    (control ?? item).focus();
  }

  return (
    <>
      <Tag
        ref={listRef}
        data-expanded={expanded ? "" : undefined}
        className={cn("simple:not-data-expanded:[&>:nth-child(n+4)]:hidden", className)}
        {...props}
      >
        {children}
      </Tag>
      {count > SIMPLE_MODE_ITEMS && !expanded && (
        <Button variant="outline" onClick={showAll} className="hidden w-full simple:inline-flex">
          Pokaż wszystkie ({count})
        </Button>
      )}
    </>
  );
}
