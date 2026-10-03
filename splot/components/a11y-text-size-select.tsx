"use client";

import { useState, useTransition } from "react";
import { setA11yPref } from "@/lib/a11y-actions";
import type { TextSize } from "@/lib/a11y-prefs";
import {
  SelectMenu,
  SelectMenuContent,
  SelectMenuItem,
  SelectMenuTrigger,
  SelectMenuValue,
} from "@/components/ui/select-menu";
import { cn } from "@/lib/utils";

/** `short` on the closed trigger; `preview` sizes the letter in the list. */
const OPTIONS: { value: TextSize; short: string; label: string; preview: string }[] = [
  { value: "normal", short: "A", label: "Zwykły", preview: "text-sm" },
  { value: "a-plus", short: "A+", label: "Większy", preview: "text-base" },
  { value: "a-plusplus", short: "A++", label: "Największy", preview: "text-lg" },
];

const TONES = {
  site: "border-input bg-card text-foreground hover:bg-muted",
  sidebar:
    "border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
};

/** Same size as the Prościej / Kontrast switches next to it. */
const CONTROL_CLASSES = "min-h-11 rounded-md border-2 px-3 py-2 text-sm font-bold";

/**
 * Text size select for the a11y toolbar: „Tekst: A+” on the trigger, the
 * words in the list. The trigger is named „Tekst: A+, większy”, so it starts
 * with what is on screen and a screen reader does not say just „A plus”.
 *
 * A pick saves the cookie through the
 * server action right away; the value is held in state, not in a `<form>`,
 * because React resets a form after its action and the select would jump
 * back to the old size. Without JS a native select with „Zastosuj” posts
 * the same action.
 */
export function TextSizeSelect({
  defaultValue,
  tone,
}: {
  defaultValue: TextSize;
  tone: "site" | "sidebar";
}) {
  const [value, setValue] = useState(defaultValue);
  const [, startTransition] = useTransition();

  const change = (next: string) => {
    const option = OPTIONS.find((candidate) => candidate.value === next);
    if (!option) return;
    setValue(option.value);
    const formData = new FormData();
    formData.set("pref", "textSize");
    formData.set("value", option.value);
    startTransition(() => setA11yPref(formData));
  };

  const current = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

  return (
    <>
      <div data-js-only>
        <SelectMenu value={value} onValueChange={change}>
          <SelectMenuTrigger
            aria-label={`Tekst: ${current.short}, ${current.label.toLowerCase()}`}
            className={cn(CONTROL_CLASSES, "gap-2", TONES[tone])}
          >
            <SelectMenuValue>
              <span className="font-normal">Tekst:</span> {current.short}
            </SelectMenuValue>
          </SelectMenuTrigger>
          <SelectMenuContent align="end">
            {OPTIONS.map((option) => (
              <SelectMenuItem key={option.value} value={option.value} textValue={option.label}>
                <span aria-hidden className={cn("inline-block w-10 font-bold", option.preview)}>
                  {option.short}
                </span>
                {option.label}
              </SelectMenuItem>
            ))}
          </SelectMenuContent>
        </SelectMenu>
      </div>
      <noscript>
        <style>{"[data-js-only]{display:none}"}</style>
        <form action={setA11yPref} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="pref" value="textSize" />
          <label className="flex items-center gap-2 text-sm font-bold">
            Tekst
            <select name="value" defaultValue={defaultValue} className={cn(CONTROL_CLASSES, TONES[tone])}>
              {OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.short} {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={cn(CONTROL_CLASSES, TONES[tone])}>
            Zastosuj
          </button>
        </form>
      </noscript>
    </>
  );
}
