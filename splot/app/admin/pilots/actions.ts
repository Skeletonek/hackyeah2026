"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { PILOT_STATUS_LABELS } from "@/lib/labels";
import { notify } from "@/lib/notifications/notify";
import { Constants } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type PilotActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }
  | null;

const RETRY = "Nie udało się zapisać zmian. Spróbuj ponownie.";

/** The innovation page shows the places, the rating and the approved reviews. */
function revalidatePilots(slug: string | undefined) {
  revalidatePath("/admin/pilots");
  if (slug) revalidatePath(`/library/${slug}`);
}

const statusInput = z.object({
  id: z.uuid(),
  status: z.enum(Constants.public.Enums.pilot_status, "Wybierz status z listy."),
});

/** The status select on an application row; the applicant is told about the change. */
export async function updatePilotStatus(
  _previous: PilotActionState,
  formData: FormData,
): Promise<PilotActionState> {
  await requireRole(["admin"], "/admin/pilots");

  const parsed = statusInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Popraw zaznaczone pola.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { id, status } = parsed.data;

  const supabase = await createClient();
  const { data: before } = await supabase.from("pilots").select("status").eq("id", id).maybeSingle();
  if (!before) return { ok: false, error: "Nie znaleziono zgłoszenia do testów." };
  if (before.status === status) return { ok: true };

  const { data: row, error } = await supabase
    .from("pilots")
    .update({ status })
    .eq("id", id)
    .select("user_id, contact_email, innovation:innovations(title, slug)")
    .single();
  if (error) {
    console.error("updatePilotStatus failed", id, error);
    return { ok: false, error: RETRY };
  }

  // The status is saved either way; a failed notification must not undo it.
  try {
    await notify({
      type: "status_changed",
      recipientId: row.user_id,
      title: `Testowanie „${row.innovation.title}”: ${PILOT_STATUS_LABELS[status]}`,
      link: `/library/${row.innovation.slug}/pilot`,
      email: row.contact_email,
    });
  } catch (notifyError) {
    console.error("updatePilotStatus notify failed", id, notifyError);
  }

  revalidatePilots(row.innovation.slug);
  return { ok: true };
}

const moderateInput = z.object({
  id: z.uuid(),
  decision: z.enum(["approve", "hide"]),
});

/**
 * „Zatwierdź” publishes a review, „Ukryj” keeps it off the innovation page.
 * Both mark it as moderated (`approved`), which also locks it for its author.
 */
export async function moderateReview(
  _previous: PilotActionState,
  formData: FormData,
): Promise<PilotActionState> {
  await requireRole(["admin"], "/admin/pilots");

  const parsed = moderateInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Nie znaleziono opinii." };
  const { id, decision } = parsed.data;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("pilot_reviews")
    .update({ approved: true, is_public: decision === "approve" })
    .eq("id", id)
    .select("pilot:pilots(innovation:innovations(slug))")
    .maybeSingle();
  if (error) {
    console.error("moderateReview failed", id, error);
    return { ok: false, error: RETRY };
  }
  if (!row) return { ok: false, error: "Nie znaleziono opinii." };

  revalidatePilots(row.pilot.innovation.slug);
  return { ok: true };
}
