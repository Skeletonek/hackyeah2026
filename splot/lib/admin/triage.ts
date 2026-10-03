import "server-only";

import { generateObject } from "ai";
import { z } from "zod";
import { embed } from "@/lib/ai/embed";
import { createAdminClient } from "@/lib/supabase/admin";
import { Constants } from "@/lib/supabase/database.types";

const MODEL = "anthropic/claude-sonnet-5.5";
/** How alike two descriptions must be before we call them the same case. */
const DUPLICATE_THRESHOLD = 0.85;
/** Only recent cases count as duplicates; older ones are history, not a clash. */
const DUPLICATE_WINDOW_DAYS = 90;
const DUPLICATE_CANDIDATES = 5;
/** Innovations handed to the model as suggestions. */
const INNOVATION_CANDIDATES = 8;

const triageResultSchema = z.object({
  category: z.enum(Constants.public.Enums.challenge_category).nullable(),
  priority: z.enum(Constants.public.Enums.priority),
  summary: z.string().max(400),
  suggestedSlugs: z.array(z.string()).max(3),
  needsExpert: z.boolean(),
});

type TriageResult = z.infer<typeof triageResultSchema>;

function systemPrompt(): string {
  return [
    "Jesteś asystentem ROPS Kraków. Klasyfikujesz zgłoszenia mieszkańców, gmin i organizacji.",
    "Odpowiadasz po polsku.",
    "summary: 1–2 zdania po polsku, konkretnie o problemie, maks. 400 znaków.",
    "category: jedna z siedmiu kategorii wyzwań; null, gdy opis jest zbyt ogólny.",
    "priority: high, gdy potrzeba pilnej reakcji (zdrowie, bezpieczeństwo, brak miejsca w DPS), inaczej medium albo low.",
    "suggestedSlugs: slugi innowacji z listy, które pasują do tego zgłoszenia; tylko z podanej listy, maksymalnie 3.",
    "needsExpert: true, gdy opis wymaga fachowej oceny.",
    "Nie wymyślaj faktów, których nie ma w opisie.",
  ].join("\n");
}

function userPrompt(input: {
  body: string;
  municipality: string | null;
  county: string | null;
  kind: string;
  candidates: { slug: string; title: string; lead: string | null }[];
}): string {
  const lines = [
    `Rodzaj zgłoszenia: ${input.kind}`,
    input.municipality ? `Gmina: ${input.municipality}` : null,
    input.county ? `Powiat: ${input.county}` : null,
    "",
    "OPIS ZGŁOSZENIA:",
    input.body,
    "",
    "INNOWACJE Z BIBLIOTEKI (możesz sugerować tylko te):",
    ...input.candidates.map(
      (candidate) => `- ${candidate.slug}: ${candidate.title}${candidate.lead ? ` — ${candidate.lead}` : ""}`,
    ),
  ];
  return lines.filter((line) => line !== null).join("\n");
}

/** Most similar earlier case, or null when nothing is close enough. */
async function findDuplicate(
  supabase: ReturnType<typeof createAdminClient>,
  embedding: number[],
  submissionId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("similar_submissions", {
    query_embedding: JSON.stringify(embedding),
    match_count: DUPLICATE_CANDIDATES,
    exclude_id: submissionId,
  });
  if (error) throw new Error(`similar_submissions failed: ${error.message}`);

  const close = (data ?? []).filter((row) => row.similarity >= DUPLICATE_THRESHOLD);
  if (close.length === 0) return null;

  // The RPC ranks by similarity only, so drop cases older than the window.
  const { data: fresh, error: freshError } = await supabase
    .from("submissions")
    .select("id, created_at")
    .in(
      "id",
      close.map((row) => row.id),
    );
  if (freshError) throw new Error(`duplicate window failed: ${freshError.message}`);

  const cutoff = Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const inWindow = new Set(
    (fresh ?? [])
      .filter((row) => new Date(row.created_at).getTime() >= cutoff)
      .map((row) => row.id),
  );
  return close.find((row) => inWindow.has(row.id))?.id ?? null;
}

/**
 * AI triage of one submission: embedding, suggested innovations, a summary,
 * a category, a priority and a possible duplicate.
 *
 * Called fire-and-forget by `onSubmissionCreated` after every submission. Runs
 * on the secret-key client because RLS deliberately hides other people's
 * submissions from the submitter. Advisory only: an admin confirms everything,
 * and once `ai_triaged_at` is set this never writes again.
 */
export async function triageSubmission(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: submission, error: loadError } = await supabase
    .from("submissions")
    .select("id, body, kind, municipality, county, category, priority, ai_triaged_at")
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw new Error(`triage load failed: ${loadError.message}`);
  if (!submission) {
    console.warn("triage: submission not found", id);
    return;
  }
  // Someone triaged or edited it already: the first answer wins.
  if (submission.ai_triaged_at) return;

  try {
    const embedding = await embed(submission.body);

    const { data: matches, error: matchError } = await supabase.rpc("match_innovations", {
      query_text: submission.body,
      query_embedding: JSON.stringify(embedding),
      match_count: INNOVATION_CANDIDATES,
    });
    if (matchError) throw new Error(`match_innovations failed: ${matchError.message}`);

    const candidates = (matches ?? []).map((row) => ({
      slug: row.slug,
      title: row.title,
      lead: row.lead,
    }));

    const { object } = await generateObject({
      model: MODEL,
      schema: triageResultSchema,
      system: systemPrompt(),
      prompt: userPrompt({ ...submission, candidates }),
    });
    const result = object as TriageResult;

    const possibleDuplicateId = await findDuplicate(supabase, embedding, id);

    const { error: writeError } = await supabase
      .from("submissions")
      .update({
        ai_summary: result.summary,
        // A slug the model invented is worse than no suggestion.
        ai_suggested_slugs: result.suggestedSlugs.filter((slug) =>
          candidates.some((candidate) => candidate.slug === slug),
        ),
        ai_needs_expert: result.needsExpert,
        ai_model: MODEL,
        embedding: JSON.stringify(embedding),
        possible_duplicate_id: possibleDuplicateId,
        ...(submission.category === null ? { category: result.category } : {}),
        ...(submission.priority === null ? { priority: result.priority } : {}),
        ai_triaged_at: new Date().toISOString(),
      })
      .eq("id", id)
      // Lost the race against an admin: leave their answer alone.
      .is("ai_triaged_at", null);
    if (writeError) throw new Error(`triage write failed: ${writeError.message}`);
  } catch (error) {
    // ai_triaged_at stays null, so the inbox can offer „Uruchom ponownie”.
    console.error("triage failed", submission.kind, id, error);
  }
}