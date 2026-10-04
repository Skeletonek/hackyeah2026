import "server-only";
import type { NotificationType } from "@/lib/notifications/notify";

const RESEND_API_URL = "https://api.resend.com/emails";
/** Resend's shared sender works without a verified domain (it then delivers only to the account owner). */
const DEFAULT_FROM = "Splot <onboarding@resend.dev>";

const ACTION_LABELS: Record<NotificationType, string> = {
  submission_received: "Sprawdź status zgłoszenia",
  thread_reply: "Przeczytaj odpowiedź",
  status_changed: "Zobacz status zgłoszenia",
  call_published: "Zobacz nabór",
};

export type NotificationEmail = {
  type: NotificationType;
  to: string;
  title: string;
  /** In-app path; the e-mail carries it as an absolute URL. */
  link: string;
  caseNumber: string | null;
};

export function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Inlined at build time, like every NEXT_PUBLIC_ variable; an empty build arg falls back too. */
function absoluteUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").toString();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * KOM6: the title, the case number and one link. Nothing else about the
 * person or the submission goes into the e-mail.
 */
export function renderNotificationEmail({ type, title, link, caseNumber }: Omit<NotificationEmail, "to">) {
  const url = absoluteUrl(link);
  const action = ACTION_LABELS[type];
  const footer = "Tę wiadomość wysłał automatycznie Splot, Małopolski Hub Innowacji Społecznych (ROPS Kraków). Nie odpowiadaj na nią.";

  const text = [
    title,
    caseNumber ? `Numer sprawy: ${caseNumber}` : null,
    `${action}: ${url}`,
    "",
    footer,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px 16px;background:#F5F8F7;color:#13201E;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.5">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #C8D4D1;border-radius:12px;padding:32px 24px">
    <p style="margin:0 0 24px;font-weight:bold;color:#0B5E57">Splot</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.3">${escapeHtml(title)}</h1>
    ${caseNumber ? `<p style="margin:0 0 24px">Numer sprawy: <strong>${escapeHtml(caseNumber)}</strong></p>` : ""}
    <p style="margin:0 0 24px">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;border-radius:8px;background:#0B5E57;color:#FFFFFF;font-weight:bold;text-decoration:none">${escapeHtml(action)}</a>
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#475955">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br><a href="${escapeHtml(url)}" style="color:#0B5E57;word-break:break-all">${escapeHtml(url)}</a></p>
    <p style="margin:0;font-size:16px;color:#475955">${escapeHtml(footer)}</p>
  </div>
</body>
</html>`;

  return { subject: title, html, text };
}

/** Throws on a Resend error; notify() catches it so the caller never fails. */
export async function sendNotificationEmail(email: NotificationEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { subject, html, text } = renderNotificationEmail(email);
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to: [email.to],
      subject,
      html,
      text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend responded ${response.status}: ${await response.text()}`);
  }
}
