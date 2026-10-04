"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { useIsWide } from "./use-is-wide";

/**
 * A row link of the inbox. Below `xl` the preview opens in a sheet, so the
 * list keeps its scroll position and closing the sheet lands in the same place.
 */
export function RowLink(props: ComponentProps<typeof Link>) {
  const isWide = useIsWide();
  return <Link scroll={isWide !== false} {...props} />;
}
