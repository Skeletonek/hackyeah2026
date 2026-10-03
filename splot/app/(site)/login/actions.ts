"use server";

import { cookies } from "next/headers";
import { NEXT_PATH_COOKIE, safePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  status: "idle" | "sent" | "error";
  email?: string;
  error?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendMagicLink(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      email,
      error: "Wpisz adres z małpą (@), np. jan@poczta.pl.",
    };
  }

  (await cookies()).set(NEXT_PATH_COOKIE, safePath(formData.get("next")), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60,
    path: "/",
  });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Someone submitted without an account: attach the email to the same
  // anonymous user so their submissions stay on the account.
  if (data?.claims?.is_anonymous) {
    const { error } = await supabase.auth.updateUser({ email });
    if (!error) return { status: "sent", email };
    if (error.code !== "email_exists") return sendError(email, error.code);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) return sendError(email, error.code);

  return { status: "sent", email };
}

function sendError(email: string, code: string | undefined): LoginState {
  const rateLimited =
    code === "over_email_send_rate_limit" || code === "over_request_rate_limit";
  return {
    status: "error",
    email,
    error: rateLimited
      ? "Wysłaliśmy już kilka linków. Poczekaj kilka minut i spróbuj jeszcze raz."
      : "Nie udało się wysłać linku. Spróbuj jeszcze raz za chwilę.",
  };
}
