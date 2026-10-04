"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { callFormValues, callInput } from "@/lib/admin/call-fields";
import { createClient } from "@/lib/supabase/server";

export type CallFormState =
  /** `keys` are the saved row keys, in the order the rows were sent. */
  | { ok: true; keys: { sections: string[]; criteria: string[] } }
  /** `fieldErrors` keys are form paths: `title`, `sections.2.label`, `criteria.0.label`. */
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

const RETRY = "Nie udało się zapisać naboru. Spróbuj ponownie.";

/**
 * „Zapisz” on the configurator: creates or updates a grant call under the
 * admin RLS policy. The sections and criteria saved here are the form the
 * application generator shows to authors.
 */
export async function saveCall(formData: FormData): Promise<CallFormState> {
  await requireRole(["admin"], "/admin/calls");

  const parsed = callInput.safeParse(callFormValues(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Popraw zaznaczone pola.", fieldErrors };
  }

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("grant_calls").update(values).eq("id", id).select("id").maybeSingle()
    : await supabase.from("grant_calls").insert(values).select("id").maybeSingle();
  if (error) {
    console.error("saveCall failed", id, error);
    return { ok: false, error: RETRY };
  }
  if (!data) return { ok: false, error: "Nie znaleziono naboru. Mógł zostać usunięty." };

  revalidatePath("/admin/calls", "layout");
  // The home page shows the „Trwa nabór” bar.
  revalidatePath("/");

  if (!id) redirect(`/admin/calls/${data.id}?saved=new`);
  return {
    ok: true,
    keys: { sections: values.sections.map(({ key }) => key), criteria: values.criteria.map(({ key }) => key) },
  };
}
