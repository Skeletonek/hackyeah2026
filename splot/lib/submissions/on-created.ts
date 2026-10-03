import "server-only";
import { after } from "next/server";
import { triageSubmission } from "@/lib/admin/triage";
import { notify } from "@/lib/notifications/notify";
import type { Tables } from "@/lib/supabase/database.types";

export type CreatedSubmission = Pick<
  Tables<"submissions">,
  "id" | "case_number" | "tracking_token" | "author_id" | "contact_email"
>;

/** Tracking link: status and thread without an account. */
export function trackingLink(sub: Pick<CreatedSubmission, "case_number" | "tracking_token">) {
  return `/status/${encodeURIComponent(sub.case_number)}/${encodeURIComponent(sub.tracking_token)}`;
}

/**
 * The only thing a stream calls after inserting a submission. Triage and the
 * "received" notification run after the response, so they never slow down or
 * fail the save.
 */
export function onSubmissionCreated(sub: CreatedSubmission) {
  after(async () => {
    const results = await Promise.allSettled([
      triageSubmission(sub.id),
      notify({
        type: "submission_received",
        recipientId: sub.author_id,
        submissionId: sub.id,
        title: `Przyjęliśmy zgłoszenie ${sub.case_number}`,
        link: trackingLink(sub),
        email: sub.contact_email ?? undefined,
      }),
    ]);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("onSubmissionCreated failed", sub.case_number, result.reason);
      }
    }
  });
}
