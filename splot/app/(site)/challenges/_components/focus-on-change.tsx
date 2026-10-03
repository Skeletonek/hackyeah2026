"use client";

import { useEffect, useRef } from "react";

/**
 * Moves focus to the county panel heading when the picked county changes, so a
 * keyboard or screen reader user lands on the details. Not on the first load.
 */
export function FocusOnChange({ targetId, value }: { targetId: string; value: string | undefined }) {
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (value) document.getElementById(targetId)?.focus();
  }, [targetId, value]);

  return null;
}
