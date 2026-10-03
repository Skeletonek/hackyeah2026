import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

/** Cookies behind the Prościej / Kontrast / A+ switches. */
export const A11Y_COOKIES = {
  kontrast: "splot_kontrast",
  textSize: "splot_text_size",
  simple: "splot_simple",
} as const;

export const TEXT_SIZES = ["normal", "a-plus", "a-plusplus"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export type A11yPrefs = {
  /** High-contrast theme: `data-theme="kontrast"` on `<html>`. */
  kontrast: boolean;
  /** `a-plus` / `a-plusplus` class on `<html>` (112.5% / 125% root font size). */
  textSize: TextSize;
  /** Simple mode: `data-mode="simple"` on `<html>`. */
  simple: boolean;
};

export function isTextSize(value: unknown): value is TextSize {
  return TEXT_SIZES.includes(value as TextSize);
}

/**
 * Reads the switches from cookies so the root layout can apply them on
 * `<html>` during the server render (no flash on load).
 */
export const getA11yPrefs = cache(async (): Promise<A11yPrefs> => {
  const cookieStore = await cookies();
  const textSize = cookieStore.get(A11Y_COOKIES.textSize)?.value;

  return {
    kontrast: cookieStore.get(A11Y_COOKIES.kontrast)?.value === "1",
    textSize: isTextSize(textSize) ? textSize : "normal",
    simple: cookieStore.get(A11Y_COOKIES.simple)?.value === "1",
  };
});
