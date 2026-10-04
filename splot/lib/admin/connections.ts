import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeCategory } from "@/lib/labels";

/**
 * Pending connection requests for /admin/connections (SPL-48).
 * Admins read every row through the `connection_requests: admin manage` policy.
 */

export type ConnectionRequest = {
  id: string;
  createdAt: string;
  from: SubmissionSide;
  to: SubmissionSide;
};

export type SubmissionSide = {
  id: string;
  caseNumber: string;
  county: string | null;
  municipality: string | null;
  category: ChallengeCategory | null;
  aiSummary: string | null;
  authorId: string;
};

export async function listPendingConnectionRequests(): Promise<ConnectionRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connection_requests")
    .select(
      `
      id,
      created_at,
      from:from_submission_id (
        id, case_number, county, municipality, category, ai_summary, author_id
      ),
      to:to_submission_id (
        id, case_number, county, municipality, category, ai_summary, author_id
      )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listPendingConnectionRequests failed: ${error.message}`);

  return (data ?? []).map((row) => {
    const from = row.from as unknown as SubmissionSideRaw;
    const to = row.to as unknown as SubmissionSideRaw;
    return {
      id: row.id,
      createdAt: row.created_at,
      from: normalizeSide(from),
      to: normalizeSide(to),
    };
  });
}

type SubmissionSideRaw = {
  id: string;
  case_number: string;
  county: string | null;
  municipality: string | null;
  category: ChallengeCategory | null;
  ai_summary: string | null;
  author_id: string;
};

function normalizeSide(raw: SubmissionSideRaw): SubmissionSide {
  return {
    id: raw.id,
    caseNumber: raw.case_number,
    county: raw.county,
    municipality: raw.municipality,
    category: raw.category,
    aiSummary: raw.ai_summary,
    authorId: raw.author_id,
  };
}
