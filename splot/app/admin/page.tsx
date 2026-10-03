import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Zgłoszenia" };

export default async function AdminInboxPage() {
  const supabase = await createClient();
  // Admins see everything via the "submissions: admin reads all" RLS policy.
  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("id, case_number, body, municipality, status, category, priority, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main id="main-content" className="flex flex-col gap-6 p-8">
      <h1 className="text-h1">Zgłoszenia</h1>
      {error && <p role="alert">Nie udało się wczytać zgłoszeń.</p>}
      <ul className="flex flex-col gap-3">
        {submissions?.map((submission) => (
          <li key={submission.id} className="rounded-lg border bg-card p-4">
            <p className="font-mono text-sm text-muted-foreground">
              {submission.case_number} · {submission.municipality ?? "gmina nieznana"} · {submission.status}
            </p>
            <p className="font-bold">{submission.body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
