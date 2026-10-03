import "server-only";

import { Constants } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  ChallengeCategory,
  Priority,
  SubmissionKind,
  SubmissionStatus,
} from "@/lib/labels";

/** The four filters of the GET form on /admin/submissions. */
export type SubmissionFilters = {
  status?: SubmissionStatus;
  kind?: SubmissionKind;
  category?: ChallengeCategory;
  priority?: Priority;
};

export type InboxRow = {
  id: string;
  case_number: string;
  kind: Submission["kind"];
  created_at: string;
  category: Submission["category"];
  priority: Submission["priority"];
  status: Submission["status"];
  possible_duplicate_id: string | null;
  ai_triaged_at: string | null;
  ai_summary: string | null;
  body: string;
  municipality: string | null;
  county: string | null;
  contact_email: string | null;
};

type Submission = {
  kind: SubmissionKind;
  category: ChallengeCategory | null;
  priority: Priority | null;
  status: SubmissionStatus;
};

const COLUMNS =
  "id, case_number, kind, created_at, category, priority, status, possible_duplicate_id, ai_triaged_at, ai_summary, body, municipality, county, contact_email";

const PAGE_SIZE = 50;

/** One filter value or nothing; anything unknown is dropped, never trusted. */
function pick<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return allowed.includes(candidate as T) ? (candidate as T) : undefined;
}

export function parseFilters(params: {
  status?: string | string[];
  kind?: string | string[];
  category?: string | string[];
  priority?: string | string[];
}): SubmissionFilters {
  return {
    status: pick(params.status, Constants.public.Enums.submission_status),
    kind: pick(params.kind, Constants.public.Enums.submission_kind),
    category: pick(params.category, Constants.public.Enums.challenge_category),
    priority: pick(params.priority, Constants.public.Enums.priority),
  };
}

export function hasFilters(filters: SubmissionFilters): boolean {
  return Object.values(filters).some(Boolean);
}

/** Newest first. Admins see every submission through the admin RLS policy. */
export async function listSubmissions(filters: SubmissionFilters): Promise<InboxRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("submissions")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.priority) query = query.eq("priority", filters.priority);

  const { data, error } = await query;
  if (error) throw new Error(`listSubmissions failed: ${error.message}`);
  return (data ?? []) as InboxRow[];
}

/** The row behind the preview pane; `null` for an unknown or deleted id. */
export async function getSubmission(id: string): Promise<InboxRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("submissions")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getSubmission failed: ${error.message}`);
  return data as InboxRow | null;
}