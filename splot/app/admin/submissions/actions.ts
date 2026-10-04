"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { MANUAL_STATUSES } from "@/lib/admin/statuses";
import { triageSubmission } from "@/lib/admin/triage";
import { SUBMISSION_STATUS_LABELS } from "@/lib/labels";
import { notify } from "@/lib/notifications/notify";
import { Constants } from "@/lib/supabase/database.types";
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
export type DetailActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }
  | null;

const RETRY = "Nie udało się zapisać zmian. Spróbuj ponownie.";

function invalid(error: z.ZodError): DetailActionState {
  return {
    ok: false,
    error: "Popraw zaznaczone pola.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

function revalidateSubmission(id: string) {
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
}

const triageInput = z.object({
  id: z.uuid(),
  category: z.enum(Constants.public.Enums.challenge_category, "Wybierz kategorię z listy."),
  priority: z.enum(Constants.public.Enums.priority, "Wybierz priorytet z listy."),
});

/**
 * „Zatwierdź ocenę": saving the AI pre-filled category and priority confirms
 * them; changing either corrects the triage.
 */
export async function updateTriage(
  _previous: DetailActionState,
  formData: FormData,
): Promise<DetailActionState> {
  await requireRole(["admin"], "/admin/submissions");

  const parsed = triageInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, category, priority } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("submissions").update({ category, priority }).eq("id", id);
  if (error) {
    console.error("updateTriage failed", id, error);
    return { ok: false, error: RETRY };
  }

  revalidateSubmission(id);
  return { ok: true };
}

const statusInput = z.object({
  id: z.uuid(),
  status: z.enum(MANUAL_STATUSES, "Wybierz status z listy."),
});

/** Changes the status, then tells the author (in-app and by e-mail). */
export async function updateStatus(
  _previous: DetailActionState,
  formData: FormData,
): Promise<DetailActionState> {
  await requireRole(["admin"], "/admin/submissions");

  const parsed = statusInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, status } = parsed.data;

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("submissions")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!before) return { ok: false, error: "Nie znaleziono zgłoszenia." };
  if (before.status === status) return { ok: true };

  const { data: row, error } = await supabase
    .from("submissions")
    .update({ status })
    .eq("id", id)
    .select("case_number, author_id, contact_email")
    .single();
  if (error) {
    console.error("updateStatus failed", id, error);
    return { ok: false, error: RETRY };
  }

  // The status is saved either way; a failed notification must not undo it.
  try {
    await notify({
      type: "status_changed",
      recipientId: row.author_id,
      submissionId: id,
      title: `Zgłoszenie ${row.case_number}: ${SUBMISSION_STATUS_LABELS[status]}`,
      link: `/account/submissions/${id}`,
      email: row.contact_email ?? undefined,
    });
  } catch (notifyError) {
    console.error("updateStatus notify failed", id, notifyError);
  }

  revalidateSubmission(id);
  return { ok: true };
}

/** „Odrzuć" on the duplicate banner: ROPS decided it is a different case. */
export async function dismissDuplicate(
  _previous: DetailActionState,
  formData: FormData,
): Promise<DetailActionState> {
  await requireRole(["admin"], "/admin/submissions");

  const id = uuid(formData.get("id"));
  if (!id) return { ok: false, error: "Nie znaleziono zgłoszenia." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .update({ possible_duplicate_id: null })
    .eq("id", id);
  if (error) {
    console.error("dismissDuplicate failed", id, error);
    return { ok: false, error: RETRY };
  }

  revalidateSubmission(id);
  return { ok: true };
}
