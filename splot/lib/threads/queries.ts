import "server-only";
import { z } from "zod";
import type { SubmissionKind, SubmissionStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export type TrackedSubmission = {
  caseNumber: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
};

/** One message as the tracking link shows it: which side wrote it, never who. */
export type TrackedMessage = {
  body: string;
  createdAt: string;
  isStaff: boolean;
};

export type Tracked = {
  submission: TrackedSubmission;
  messages: TrackedMessage[];
  /** Set only when the current session wrote the submission. */
  ownSubmissionId: string | null;
};

export type OwnSubmission = {
  id: string;
  caseNumber: string;
  trackingToken: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  createdAt: string;
};

/**
 * What a tracking link opens: the status and the thread, without an account.
 * A wrong case number, a wrong token and a malformed link all return null, so
 * the page never hints whether a case exists.
 */
export async function trackSubmission(caseNumber: string, token: string): Promise<Tracked | null> {
  if (!z.uuid().safeParse(token).success) return null;

  const supabase = await createClient();
  const args = { p_case_number: caseNumber, p_token: token };

  const { data: rows, error } = await supabase.rpc("track_submission", args);
  if (error) throw new Error(`track_submission failed: ${error.message}`);
  const row = rows?.[0];
  if (!row) return null;

  const [messages, own, claims] = await Promise.all([
    supabase.rpc("track_submission_messages", args),
    // RLS: returns a row only to the author, the assigned expert or an admin.
    supabase
      .from("submissions")
      .select("id, author_id")
      .eq("case_number", caseNumber)
      .eq("tracking_token", token)
      .maybeSingle(),
    supabase.auth.getClaims(),
  ]);
  if (messages.error) {
    throw new Error(`track_submission_messages failed: ${messages.error.message}`);
  }

  const userId = claims.data?.claims?.sub;
  const isAuthor = Boolean(userId) && own.data?.author_id === userId;

  return {
    submission: {
      caseNumber: row.case_number,
      kind: row.kind,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    messages: (messages.data ?? []).map((message) => ({
      body: message.body,
      createdAt: message.created_at,
      isStaff: message.is_staff,
    })),
    ownSubmissionId: isAuthor ? (own.data?.id ?? null) : null,
  };
}

/** Submissions written in the current session (account or anonymous), newest first. */
export async function listOwnSubmissions(): Promise<OwnSubmission[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("submissions")
    .select("id, case_number, tracking_token, kind, status, created_at")
    // RLS also shows experts and admins other people's submissions; not here.
    .eq("author_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listOwnSubmissions failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    caseNumber: row.case_number,
    trackingToken: row.tracking_token,
    kind: row.kind,
    status: row.status,
    createdAt: row.created_at,
  }));
}
