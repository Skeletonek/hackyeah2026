import "server-only";
import { z } from "zod";
import type { SubmissionKind, SubmissionStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { toThreadMessage, type MessageRow, type ThreadMessage } from "@/lib/threads/messages";

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

export type InboxThread = {
  id: string;
  subject: string;
  submissionId: string | null;
  caseNumber: string | null;
  lastMessage: {
    body: string;
    createdAt: string;
    isOwn: boolean;
  } | null;
};

export type ParticipantThread = {
  submission: OwnSubmissionThread["submission"];
  threadId: string;
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

/**
 * All threads the current user participates in, with the last message and the
 * related submission case number. Sorted by the last message time, newest first.
 */
export async function listParticipantThreads(userId: string): Promise<InboxThread[]> {
  const supabase = await createClient();

  const { data: participants, error: participantsError } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("user_id", userId);
  if (participantsError) {
    throw new Error(`listParticipantThreads participants failed: ${participantsError.message}`);
  }

  const threadIds = participants?.map((row) => row.thread_id) ?? [];
  if (threadIds.length === 0) return [];

  const { data: threads, error: threadsError } = await supabase
    .from("threads")
    .select("id, subject, submission_id, submissions:submission_id (case_number)")
    .in("id", threadIds)
    .order("created_at", { ascending: false });
  if (threadsError) {
    throw new Error(`listParticipantThreads threads failed: ${threadsError.message}`);
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, thread_id, body, created_at, author_id")
    .in("thread_id", threadIds)
    .eq("from_assistant", false)
    .order("created_at", { ascending: true });
  if (messagesError) {
    throw new Error(`listParticipantThreads messages failed: ${messagesError.message}`);
  }

  const messagesByThread = new Map<string, MessageRow[]>();
  for (const message of messages ?? []) {
    const list = messagesByThread.get(message.thread_id) ?? [];
    list.push(message);
    messagesByThread.set(message.thread_id, list);
  }

  return (threads ?? []).map((thread) => {
    const threadMessages = messagesByThread.get(thread.id) ?? [];
    const last = threadMessages[threadMessages.length - 1] ?? null;
    const submission = thread.submissions as unknown as { case_number: string } | null;
    return {
      id: thread.id,
      subject: thread.subject,
      submissionId: thread.submission_id,
      caseNumber: submission?.case_number ?? null,
      lastMessage: last
        ? { body: last.body, createdAt: last.created_at, isOwn: last.author_id === userId }
        : null,
    };
  }).sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? "";
    const bTime = b.lastMessage?.createdAt ?? "";
    return bTime.localeCompare(aTime);
  });
}

/**
 * Loads a specific thread for a participant, including its submission context.
 * Used by `/account/submissions/[id]?thread=<id>` so a partnership thread can
 * be viewed even when the user does not own the submission.
 */
export async function getThreadForParticipant(
  threadId: string,
  userId: string,
): Promise<ParticipantThread | null> {
  if (!z.uuid().safeParse(threadId).success) return null;

  const supabase = await createClient();

  const { data: membership, error: membershipError } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipError) {
    throw new Error(`getThreadForParticipant membership failed: ${membershipError.message}`);
  }
  if (!membership) return null;

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select(
      `
      id,
      submission_id,
      submissions:submission_id (id, case_number, kind, status, body, idea_id, created_at)
    `,
    )
    .eq("id", threadId)
    .maybeSingle();
  if (threadError) {
    throw new Error(`getThreadForParticipant thread failed: ${threadError.message}`);
  }
  if (!thread) return null;

  const submission = thread.submissions as unknown as
    | {
        id: string;
        case_number: string;
        kind: SubmissionKind;
        status: SubmissionStatus;
        body: string;
        idea_id: string | null;
        created_at: string;
      }
    | null;
  if (!submission) return null;

  const { data, error: messagesError } = await supabase
    .from("messages")
    .select("id, body, created_at, author_id")
    .eq("thread_id", threadId)
    .eq("from_assistant", false)
    .order("created_at", { ascending: true });
  if (messagesError) {
    throw new Error(`getThreadForParticipant messages failed: ${messagesError.message}`);
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
    threadId: thread.id,
    messages: (data ?? []).map((row) => toThreadMessage(row, userId)),
  };
}
