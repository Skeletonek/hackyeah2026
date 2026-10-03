"use client";

import { useId, useRef } from "react";
import { setA11yPref } from "@/lib/a11y-actions";
import type { TextSize } from "@/lib/a11y-prefs";
import { cn } from "@/lib/utils";

const OPTIONS: { value: TextSize; label: string }[] = [
  { value: "normal", label: "Zwykły" },
  { value: "a-plus", label: "Większy" },
  { value: "a-plusplus", label: "Największy" },
];

const TONES = {
  site: "border-input bg-card text-foreground hover:bg-muted",
  sidebar:
    "border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
};

const BUTTON_CLASSES =
  "min-h-11 rounded-md border-2 px-3 py-2 text-sm font-bold";

/**
 * Native text-size select for the a11y toolbar.
 *
 * With JS the form submits on change through the server action (no page
 * reload, focus stays on the select). Without JS a visible „Zastosuj” button
 * inside `<noscript>` is shown and the form posts normally.
 */
export function TextSizeSelect({
  defaultValue,
  tone,
}: {
  defaultValue: TextSize;
  tone: "site" | "sidebar";
}) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={setA11yPref}
      className="flex flex-wrap items-center gap-2"
      onChange={() => {
        formRef.current?.requestSubmit();
      }}
    >
      <input type="hidden" name="pref" value="textSize" />
      <label htmlFor={id} className="text-sm font-bold">
        Rozmiar tekstu
      </label>
      <select
        id={id}
        name="value"
        defaultValue={defaultValue}
        className={cn(
          "min-h-11 cursor-pointer rounded-md border-2 px-3 py-2 text-sm font-bold",
          TONES[tone],
        )}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Hidden for JS users; <noscript> renders the visible fallback. */}
      <button
        type="submit"
        aria-hidden="true"
        tabIndex={-1}
        className={cn(BUTTON_CLASSES, TONES[tone], "hidden")}
      >
        Zastosuj
      </button>
      <noscript>
        <button type="submit" className={cn(BUTTON_CLASSES, TONES[tone])}>
          Zastosuj
        </button>
      </noscript>
    </form>
  );
}
