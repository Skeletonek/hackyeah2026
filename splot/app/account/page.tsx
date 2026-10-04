import type { Metadata } from "next";
import { CappedList } from "@/components/capped-list";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Moje zgłoszenia i pomysły" };

export default async function AccountPage() {
  const supabase = await createClient();
  // RLS returns only the signed-in person's submissions.
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, case_number, body, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <h1 className="text-h1 simple:text-simple-h1">Moje zgłoszenia i pomysły</h1>
      {submissions?.length ? (
        <CappedList className="flex flex-col gap-4">
          {submissions.map((submission) => (
            <li key={submission.id} className="rounded-lg border bg-card p-5">
              <p className="font-mono text-sm text-muted-foreground simple:text-simple-sm">{submission.case_number}</p>
              <p className="font-bold">{submission.body}</p>
              <p className="text-sm simple:text-simple-sm">Status: {submission.status}</p>
            </li>
          ))}
        </CappedList>
      ) : (
        <p>Nie masz jeszcze zgłoszeń.</p>
      )}
    </main>
  );
}
