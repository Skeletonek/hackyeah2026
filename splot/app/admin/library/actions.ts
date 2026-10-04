"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { innovationFormValues, innovationInput } from "@/lib/admin/library-fields";
import { embed } from "@/lib/ai/embed";
import { classifyChallenges, type ChallengeCategory } from "@/lib/innovations/classify";
import { easyReadSummary } from "@/lib/innovations/easy-read";
import { innovationEmbeddingText } from "@/lib/innovations/embedding-text";
import { Constants } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type InnovationFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }
  | null;

const RETRY = "Nie udało się zapisać innowacji. Spróbuj ponownie.";
const UNIQUE_VIOLATION = "23505";

/** The public library, its pages and the home page show innovations. */
function revalidateLibrary(...slugs: string[]) {
  revalidatePath("/admin/library", "layout");
  revalidatePath("/library");
  for (const slug of slugs) revalidatePath(`/library/${slug}`);
  revalidatePath("/");
}

/**
 * „Zapisz” on the editor: creates or updates an innovation under the admin
 * RLS policy. The embedding is recomputed only when the embedded text changed,
 * so matchmaking never searches a stale vector.
 */
export async function saveInnovation(
  _previous: InnovationFormState,
  formData: FormData,
): Promise<InnovationFormState> {
  await requireRole(["admin"], "/admin/library");

  const parsed = innovationInput.safeParse(innovationFormValues(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Popraw zaznaczone pola.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { id, ...values } = parsed.data;
  const supabase = await createClient();

  let previous: { slug: string; text: string; embedded: boolean } | null = null;
  if (id) {
    const { data, error } = await supabase
      .from("innovations")
      .select("slug, title, lead, solution, problem, audience, embedding")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("saveInnovation read failed", id, error);
      return { ok: false, error: RETRY };
    }
    if (!data) return { ok: false, error: "Nie znaleziono innowacji. Mogła zostać usunięta." };
    previous = { slug: data.slug, text: innovationEmbeddingText(data), embedded: data.embedding !== null };
  }

  const text = innovationEmbeddingText(values);
  let embedding: string | undefined;
  if (!previous || !previous.embedded || previous.text !== text) {
    try {
      embedding = JSON.stringify(await embed(text));
    } catch (error) {
      console.error("saveInnovation embed failed", id, error);
      return {
        ok: false,
        error: "Nie udało się przygotować innowacji do wyszukiwania. Nic nie zapisano. Spróbuj ponownie.",
      };
    }
  }

  const row = embedding ? { ...values, embedding } : values;
  const { error } = id
    ? await supabase.from("innovations").update(row).eq("id", id)
    : await supabase.from("innovations").insert(row);
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        ok: false,
        error: "Popraw zaznaczone pola.",
        fieldErrors: { slug: ["Ten adres ma już inna innowacja. Wpisz inny."] },
      };
    }
    console.error("saveInnovation write failed", id, error);
    return { ok: false, error: RETRY };
  }

  revalidateLibrary(values.slug, ...(previous && previous.slug !== values.slug ? [previous.slug] : []));
  // A new innovation, or a changed address, lives at a new URL.
  if (!previous) redirect(`/admin/library/${values.slug}?saved=new`);
  if (previous.slug !== values.slug) redirect(`/admin/library/${values.slug}?saved=moved`);
  return { ok: true };
}

/** „Opublikuj” / „Ukryj” on a list row. */
export async function setPublished(formData: FormData): Promise<void> {
  await requireRole(["admin"], "/admin/library");

  const parsed = z
    .object({ id: z.uuid(), published: z.enum(["true", "false"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("innovations")
    .update({ published: parsed.data.published === "true" })
    .eq("id", parsed.data.id)
    .select("slug")
    .maybeSingle();
  if (error) {
    console.error("setPublished failed", parsed.data.id, error);
    return;
  }
  revalidateLibrary(...(data ? [data.slug] : []));
}

const aiInput = z.object({
  title: z.string().trim().min(3).max(200),
  lead: z.string().trim().max(500).nullable(),
  solution: z.string().trim().max(5000).nullable(),
  problem: z.string().trim().max(5000).nullable(),
  audience: z.string().trim().max(5000).nullable(),
  adopters: z.string().trim().max(5000).nullable(),
  evidence: z.string().trim().max(5000).nullable(),
  target_groups: z.array(z.enum(Constants.public.Enums.target_group)).optional(),
});

export type InnovationAiInput = z.input<typeof aiInput>;

const NEEDS_TITLE = "Najpierw wpisz tytuł innowacji, co najmniej 3 znaki.";

/** „Wygeneruj wersję łatwą”: a proposal only, the admin decides whether to use it. */
export async function generateEasyRead(
  input: InnovationAiInput,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  await requireRole(["admin"], "/admin/library");

  const parsed = aiInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: NEEDS_TITLE };
  if (!parsed.data.solution && !parsed.data.lead) {
    return { ok: false, error: "Najpierw wpisz zajawkę albo opis „Na czym polega”." };
  }

  try {
    return { ok: true, text: await easyReadSummary(parsed.data) };
  } catch (error) {
    console.error("generateEasyRead failed", error);
    return { ok: false, error: "Nie udało się przygotować wersji łatwej. Spróbuj ponownie." };
  }
}

/** „Przypisz kategorie z AI”: pre-fills the challenge checkboxes. */
export async function suggestCategories(
  input: InnovationAiInput,
): Promise<{ ok: true; categories: ChallengeCategory[] } | { ok: false; error: string }> {
  await requireRole(["admin"], "/admin/library");

  const parsed = aiInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: NEEDS_TITLE };

  try {
    return { ok: true, categories: await classifyChallenges(parsed.data) };
  } catch (error) {
    console.error("suggestCategories failed", error);
    return { ok: false, error: "Nie udało się dobrać wyzwań. Spróbuj ponownie albo zaznacz je ręcznie." };
  }
}
