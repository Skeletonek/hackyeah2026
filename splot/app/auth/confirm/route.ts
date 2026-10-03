import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { NEXT_PATH_COOKIE, safePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["email", "email_change", "signup", "magiclink", "invite", "recovery"];

// Email links (templates in supabase/templates) land here with a token_hash.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type || !OTP_TYPES.includes(type)) {
    redirect("/auth/error?reason=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    redirect(`/auth/error?reason=${error.code === "otp_expired" ? "expired" : "invalid"}`);
  }

  const cookieStore = await cookies();
  const nextPath = cookieStore.get(NEXT_PATH_COOKIE)?.value;
  cookieStore.delete(NEXT_PATH_COOKIE);

  if (nextPath) redirect(safePath(nextPath));

  const { data: role } = await supabase.rpc("current_user_role");
  redirect(role === "admin" ? "/admin" : "/account");
}
