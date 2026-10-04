import "server-only";
import { z } from "zod";
import type { SubmissionKind, SubmissionStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import {
  toStaffThreadMessage,
  toThreadMessage,
  type StaffThreadMessage,
  type ThreadMessage,
} from "@/lib/threads/messages";

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

export type OwnSubmissionThread = {
  submission: {
    id: string;
    caseNumber: string;
    kind: SubmissionKind;
    status: SubmissionStatus;
    body: string;
    ideaId: string | null;
    createdAt: string;
  };
  /** Null only for a submission older than the trigger that creates threads. */
  threadId: string | null;
  messages: ThreadMessage[];
};

/**
 * The author's view of one submission: the case, its thread and the messages,
 * oldest first. Returns null for anyone else's submission, also for admins,
 * whom RLS would otherwise let through.
 */
export async function getOwnSubmissionThread(
  submissionId: string,
  userId: string,
): Promise<OwnSubmissionThread | null> {
  if (!z.uuid().safeParse(submissionId).success) return null;

  const supabase = await createClient();
  const { data: submission, error } = await supabase
    .from("submissions")
    .select("id, case_number, kind, status, body, idea_id, created_at, threads (id)")
    .eq("id", submissionId)
    .eq("author_id", userId)
    .maybeSingle();
  if (error) throw new Error(`getOwnSubmissionThread failed: ${error.message}`);
  if (!submission) return null;

  const threadId = submission.threads[0]?.id ?? null;
  let messages: ThreadMessage[] = [];
  if (threadId) {
    const { data, error: messagesError } = await supabase
      .from("messages")
      .select("id, body, created_at, author_id")
      .eq("thread_id", threadId)
      // AI hints in a thread are for the people answering, not for the author.
      .eq("from_assistant", false)
      .order("created_at", { ascending: true });
    if (messagesError) throw new Error(`thread messages failed: ${messagesError.message}`);
    messages = (data ?? []).map((row) => toThreadMessage(row, userId));
  }

  return {
    submission: {
      id: submission.id,
      caseNumber: submission.case_number,
      kind: submission.kind,
      status: submission.status,
      body: submission.body,
      ideaId: submission.idea_id,
      createdAt: submission.created_at,
    },
    threadId,
    messages,
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

/** One row of the ROPS thread inbox. */
export type StaffThreadRow = {
  submissionId: string;
  caseNumber: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  /** The last message, or the start of the submission when nobody has written yet. */
  preview: string;
  lastActivityAt: string;
  /** The last message is the author's, so ROPS owes a reply. */
  awaitingReply: boolean;
};

const STAFF_THREADS_LIMIT = 200;

/**
 * Every submission thread, newest activity first. Admins read all of them
 * through the admin RLS policies; call only behind `requireRole(["admin"])`.
 */
export async function listStaffThreads(): Promise<StaffThreadRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("threads")
    .select(
      "subject, created_at, submissions!inner (id, case_number, kind, status, author_id), messages (body, author_id, created_at)",
    )
    // AI hints are never part of the conversation.
    .eq("messages.from_assistant", false)
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .order("created_at", { ascending: false })
    .limit(STAFF_THREADS_LIMIT);
  if (error) throw new Error(`listStaffThreads failed: ${error.message}`);

  return (data ?? [])
    .map((thread) => {
      const last = thread.messages[0];
      return {
        submissionId: thread.submissions.id,
        caseNumber: thread.submissions.case_number,
        kind: thread.submissions.kind,
        status: thread.submissions.status,
        preview: last?.body ?? thread.subject,
        lastActivityAt: last?.created_at ?? thread.created_at,
        awaitingReply: Boolean(last) && last.author_id === thread.submissions.author_id,
      };
    })
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

export type StaffThread = {
  submission: {
    id: string;
    caseNumber: string;
    kind: SubmissionKind;
    status: SubmissionStatus;
    body: string;
    municipality: string | null;
    authorId: string;
    contactEmail: string | null;
    createdAt: string;
  };
  /** Null only for a submission older than the trigger that creates threads. */
  threadId: string | null;
  messages: StaffThreadMessage[];
};

/** ROPS's view of one submission thread, oldest message first; null for an unknown id. */
export async function getStaffThread(submissionId: string, userId: string): Promise<StaffThread | null> {
  if (!z.uuid().safeParse(submissionId).success) return null;

  const supabase = await createClient();
  const { data: submission, error } = await supabase
    .from("submissions")
    .select("id, case_number, kind, status, body, municipality, author_id, contact_email, created_at, threads (id)")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw new Error(`getStaffThread failed: ${error.message}`);
  if (!submission) return null;

  const threadId = submission.threads[0]?.id ?? null;
  let messages: StaffThreadMessage[] = [];
  if (threadId) {
    const { data, error: messagesError } = await supabase
      .from("messages")
      .select("id, body, created_at, author_id")
      .eq("thread_id", threadId)
      .eq("from_assistant", false)
      .order("created_at", { ascending: true });
    if (messagesError) throw new Error(`thread messages failed: ${messagesError.message}`);
    messages = (data ?? []).map((row) => toStaffThreadMessage(row, submission.author_id, userId));
  }

  return {
    submission: {
      id: submission.id,
      caseNumber: submission.case_number,
      kind: submission.kind,
      status: submission.status,
      body: submission.body,
      municipality: submission.municipality,
      authorId: submission.author_id,
      contactEmail: submission.contact_email,
      createdAt: submission.created_at,
    },
    threadId,
    messages,
  };
}
