import "server-only";

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

/**
 * Contract stub: the signature is final, the body is a no-op. Communication
 * replaces it (C1: notifications table, Resend e-mail, bell).
 */
export async function notify(input: NotifyInput): Promise<void> {
  void input;
}
