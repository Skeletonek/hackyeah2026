import "server-only";
import { isEmailEnabled, sendNotificationEmail } from "@/lib/notifications/email";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "submission_received"
  | "thread_reply"
  | "status_changed"
  | "call_published";

export type NotifyInput = {
  type: NotificationType;
  /** `auth.users.id` of the person to notify. */
  recipientId: string;
  submissionId?: string;
  title: string;
  /** In-app path the notification opens, e.g. a tracking link. */
  link: string;
  /** Also send an e-mail to this address. */
  email?: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * The one notification path: a row for the header bell, plus an e-mail via
 * Resend when `RESEND_API_KEY` is set and an address is known. Never throws,
 * so a failed notification never fails the caller.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const results = await Promise.allSettled([insertRow(admin, input), sendEmail(admin, input)]);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("notify failed", input.type, input.submissionId, result.reason);
      }
    }
  } catch (error) {
    console.error("notify failed", input.type, input.submissionId, error);
  }
}

async function insertRow(admin: AdminClient, input: NotifyInput) {
  const row = {
    user_id: input.recipientId,
    type: input.type,
    submission_id: input.submissionId ?? null,
    title: input.title,
    link: input.link,
  };

  // A caller may repeat an event only to add the e-mail (saving the results,
  // then „Wyślij mi na e-mail”). An identical unread row is enough in the bell.
  let duplicate = admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", row.user_id)
    .eq("type", row.type)
    .eq("title", row.title)
    .eq("link", row.link)
    .is("read_at", null);
  duplicate = row.submission_id
    ? duplicate.eq("submission_id", row.submission_id)
    : duplicate.is("submission_id", null);
  const { count, error: countError } = await duplicate;
  if (countError) throw new Error(countError.message);
  if (count) return;

  const { error } = await admin.from("notifications").insert(row);
  if (error) throw new Error(error.message);
}

async function sendEmail(admin: AdminClient, input: NotifyInput) {
  if (!isEmailEnabled()) return;

  const to = input.email ?? (await accountEmail(admin, input.recipientId));
  if (!to) return;

  await sendNotificationEmail({
    type: input.type,
    to,
    title: input.title,
    link: input.link,
    caseNumber: input.submissionId ? await caseNumber(admin, input.submissionId) : null,
  });
}

/** Anonymous sessions have no e-mail; then only the bell row is written. */
async function accountEmail(admin: AdminClient, userId: string) {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw new Error(error.message);
  return data.user.email || null;
}

async function caseNumber(admin: AdminClient, submissionId: string) {
  const { data, error } = await admin
    .from("submissions")
    .select("case_number")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.case_number ?? null;
}
