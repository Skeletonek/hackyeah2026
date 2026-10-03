"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { triageSubmission } from "@/lib/admin/triage";
import { createClient } from "@/lib/supabase/server";

export type RetryTriageState = {
  status: "idle" | "done" | "error";
  error?: string;
};

function uuid(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

/**
 * „Uruchom ponownie" in the submission detail: re-runs AI triage for one
 * submission. Admin only — the action writes through the secret-key client.
 */
export async function retryTriage(
  _previous: RetryTriageState,
  formData: FormData,
): Promise<RetryTriageState> {
  await requireRole(["admin"], "/admin/submissions");

  const id = uuid(formData.get("id"));
  if (!id) return { status: "error", error: "Nie znaleziono zgłoszenia." };

  try {
    await triageSubmission(id);

    // Triage reports its own failures in the log and leaves `ai_triaged_at`
    // null, so the result is read back instead of assumed.
    const supabase = await createClient();
    const { data } = await supabase
      .from("submissions")
      .select("ai_triaged_at")
      .eq("id", id)
      .maybeSingle();
    if (!data?.ai_triaged_at) {
      return { status: "error", error: "Triage nie powiodło się. Spróbuj ponownie." };
    }

    revalidatePath("/admin/submissions", "layout");
    return { status: "done" };
  } catch (error) {
    console.error("retryTriage failed", id, error);
    return { status: "error", error: "Triage nie powiodło się. Spróbuj ponownie." };
  }
}