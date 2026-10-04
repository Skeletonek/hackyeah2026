import "server-only";

import type { UIMessage } from "ai";
import { z } from "zod";
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

/** The inbox URL with the current filters and, optionally, the row to preview. */
export function inboxHref(filters: SubmissionFilters, selected?: string): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (selected) params.set("selected", selected);
  const query = params.toString();
  return query ? `/admin/submissions?${query}` : "/admin/submissions";
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

export type SubmissionDetail = InboxRow & {
  author_id: string;
  ai_needs_expert: boolean | null;
  /** The other submission behind the duplicate banner, if it still exists. */
  duplicate: { id: string; case_number: string } | null;
  /** Suggested innovations in the AI order; unknown or unpublished slugs are dropped. */
  suggestions: { slug: string; title: string }[];
  /** The assistant conversations behind the submission, oldest first. */
  messages: UIMessage[];
};

/** Everything the detail page shows; `null` for an unknown or deleted id. */
export async function getSubmissionDetail(id: string): Promise<SubmissionDetail | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("submissions")
    .select(`${COLUMNS}, author_id, ai_needs_expert, ai_suggested_slugs`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getSubmissionDetail failed: ${error.message}`);
  if (!data) return null;
  const { ai_suggested_slugs, ...row } = data as InboxRow &
    Pick<SubmissionDetail, "author_id" | "ai_needs_expert"> & { ai_suggested_slugs: string[] | null };

  const slugs = ai_suggested_slugs ?? [];
  const [duplicate, innovations, conversations] = await Promise.all([
    row.possible_duplicate_id
      ? supabase
          .from("submissions")
          .select("id, case_number")
          .eq("id", row.possible_duplicate_id)
          .maybeSingle()
      : null,
    slugs.length > 0
      ? supabase.from("innovations").select("slug, title").in("slug", slugs).eq("published", true)
      : null,
    supabase
      .from("conversations")
      .select("messages")
      .eq("submission_id", id)
      .order("created_at", { ascending: true }),
  ]);
  if (conversations.error) {
    throw new Error(`getSubmissionDetail conversations failed: ${conversations.error.message}`);
  }

  const titles = new Map((innovations?.data ?? []).map((item) => [item.slug, item.title]));

  return {
    ...row,
    duplicate: duplicate?.data ?? null,
    suggestions: slugs.flatMap((slug) => {
      const title = titles.get(slug);
      return title ? [{ slug, title }] : [];
    }),
    messages: (conversations.data ?? []).flatMap(
      (conversation) => conversation.messages as unknown as UIMessage[],
    ),
  };
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