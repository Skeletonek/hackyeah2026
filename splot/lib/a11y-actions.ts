"use server";

import { cookies } from "next/headers";
import { A11Y_COOKIES, isTextSize } from "@/lib/a11y-prefs";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 365 * 24 * 60 * 60,
  path: "/",
} as const;

/**
 * Form action behind the a11y switches. Each form posts the value it wants
 * (`pref` + `value`), so it works without JS and a double submit is harmless.
 */
export async function setA11yPref(formData: FormData) {
  const pref = formData.get("pref");
  const value = formData.get("value");
  const cookieStore = await cookies();

  if (pref === "kontrast" || pref === "simple") {
    if (value === "1") cookieStore.set(A11Y_COOKIES[pref], "1", COOKIE_OPTIONS);
    else cookieStore.delete(A11Y_COOKIES[pref]);
  } else if (pref === "textSize" && isTextSize(value)) {
    if (value === "normal") cookieStore.delete(A11Y_COOKIES.textSize);
    else cookieStore.set(A11Y_COOKIES.textSize, value, COOKIE_OPTIONS);
  }
}
