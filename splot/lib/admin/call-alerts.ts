import "server-only";

import { after } from "next/server";
import { callStatus } from "@/lib/admin/call-fields";
import { ideaApplicationHref } from "@/lib/ideas/card";
import { notify } from "@/lib/notifications/notify";
import { createAdminClient } from "@/lib/supabase/admin";

type SavedCall = { id: string; title: string; opens_at: string; closes_at: string };

/**
 * „Powiadom mnie” (A10): when ROPS saves a call that is open now, everyone
 * who asked to hear about the next call gets a bell row and an e-mail. Runs
 * after the response, so the save never waits for e-mails.
 */
export function sendCallAlerts(call: SavedCall) {
  if (callStatus(call) !== "open") return;
  after(() => notifyCallAlerts(call));
}

/** The idea's application under this call, or a new idea when the alert came without one. */
function alertLink(ideaId: string | null, callId: string) {
  return ideaId ? ideaApplicationHref(ideaId, callId) : `/ideas/new?call=${callId}`;
}

async function notifyCallAlerts(call: SavedCall) {
  // A system task like triage: no admin session is needed to read every alert.
  const admin = createAdminClient();
  const [alerts, sent] = await Promise.all([
    admin
      .from("call_alerts")
      .select("user_id, email, idea_id")
      .or(`call_id.is.null,call_id.eq.${call.id}`)
      .order("created_at"),
    // Every link to this call carries `call=<id>`.
    admin.from("notifications").select("user_id, link").eq("type", "call_published").like("link", `%call=${call.id}%`),
  ]);
  if (alerts.error || sent.error) {
    console.error("sendCallAlerts failed", call.id, alerts.error ?? sent.error);
    return;
  }

  // Saving the call again must not repeat a message, so whoever already has
  // this link is skipped. Several clicks for one idea give one message, sent
  // to the address given last.
  const already = new Set(sent.data.map(({ user_id, link }) => `${user_id} ${link}`));
  const pending = new Map<string, { user_id: string; email: string; link: string }>();
  for (const alert of alerts.data) {
    const link = alertLink(alert.idea_id, call.id);
    const key = `${alert.user_id} ${link}`;
    if (!already.has(key)) pending.set(key, { user_id: alert.user_id, email: alert.email, link });
  }

  await Promise.all(
    [...pending.values()].map(({ user_id, email, link }) =>
      notify({ type: "call_published", recipientId: user_id, title: `Ruszył nabór: ${call.title}`, link, email }),
    ),
  );
}
