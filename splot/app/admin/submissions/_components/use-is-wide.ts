"use client";

import { useSyncExternalStore } from "react";

/** Tailwind `xl`: from here on the preview sits beside the list. */
const WIDE_QUERY = "(min-width: 80rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** `null` on the server and before hydration: the layout is not known yet. */
export function useIsWide() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => null,
  );
}
