import "server-only";
import type { IdeaStage, SubmissionKind, SubmissionStatus } from "@/lib/labels";
import type { CreatedSubmission } from "@/lib/submissions/on-created";
import { createClient } from "@/lib/supabase/server";
import { isUuid, type Idea } from "./card";

type Client = Awaited<ReturnType<typeof createClient>>;

/** The idea card, when it exists and RLS shows it (the owner or an admin). */
export async function getIdea(id: string): Promise<Idea | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("ideas").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("getIdea failed", error.message);
    return null;
  }
  return data;
}

export type OpenGrantCall = { id: string; title: string; closes_at: string };

/** The grant call from `?call=`, only while it takes applications. */
export async function getOpenGrantCall(id: string | undefined): Promise<OpenGrantCall | null> {
  if (!id) return null;

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grant_calls")
    .select("id, title, closes_at")
    .eq("id", id)
    .lte("opens_at", now)
    .gte("closes_at", now)
    .maybeSingle();
  if (error) {
    console.error("getOpenGrantCall failed", error.message);
    return null;
  }
  return data;
}

/**
 * The advice submission made from this card, if it was sent to ROPS. There is
 * one per card; when two sends race, the oldest is the one that stays.
 */
export async function getIdeaSubmission(supabase: Client, ideaId: string): Promise<CreatedSubmission | null> {
  const { data, error } = await supabase
    .from("submissions")
    .select("id, case_number, tracking_token, author_id, contact_email")
    .eq("idea_id", ideaId)
    .eq("kind", "idea")
    .order("created_at")
    .order("id")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getIdeaSubmission failed: ${error.message}`);
  return data;
}

export type OwnIdea = {
  id: string;
  title: string;
  stage: IdeaStage | null;
  updatedAt: string;
  /** Sent to ROPS from this card: the advice submission and submitted applications. */
  submissions: { id: string; caseNumber: string; kind: SubmissionKind; status: SubmissionStatus }[];
  applications: { id: string; callId: string; callTitle: string; submitted: boolean }[];
};

/** The signed-in person's idea cards, last edited first. */
export async function listOwnIdeas(userId: string): Promise<OwnIdea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select(
      // grant_applications also joins ideas with submissions, so the embed names its key.
      `id, title, stage, updated_at,
       submissions!submissions_idea_id_fkey (id, case_number, kind, status, created_at),
       grant_applications (id, call_id, status, created_at, grant_calls (title))`,
    )
    // RLS also shows admins other people's cards; not here.
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .order("created_at", { referencedTable: "submissions" })
    .order("created_at", { referencedTable: "grant_applications" });
  if (error) throw new Error(`listOwnIdeas failed: ${error.message}`);

  return data.map((idea) => ({
    id: idea.id,
    title: idea.title,
    stage: idea.stage,
    updatedAt: idea.updated_at,
    submissions: idea.submissions.map((submission) => ({
      id: submission.id,
      caseNumber: submission.case_number,
      kind: submission.kind,
      status: submission.status,
    })),
    applications: idea.grant_applications.map((application) => ({
      id: application.id,
      callId: application.call_id,
      callTitle: application.grant_calls.title,
      submitted: application.status === "submitted",
    })),
  }));
}
