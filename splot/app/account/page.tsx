import type { Metadata } from "next";
import { CappedList } from "@/components/capped-list";
import { Pagination } from "@/components/pagination";
import { requireUser } from "@/lib/auth";
import { pageHref, pageRange, parsePage, toPage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Moje zgłoszenia i pomysły" };

const href = (page: number) => pageHref("/account", {}, page);

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const page = parsePage(await searchParams);
  const supabase = await createClient();
  const result = await supabase
    .from("submissions")
    .select("id, case_number, body, status, created_at", { count: "exact" })
    // RLS also shows experts and admins other people's submissions; not here.
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .order("id")
    .range(...pageRange(page));
  const submissions = toPage(result, page, { label: "account submissions", href });

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <h1 className="text-h1 simple:text-simple-h1">Moje zgłoszenia i pomysły</h1>
      {submissions.total > 0 ? (
        <>
          <CappedList className="flex flex-col gap-4">
            {submissions.items.map((submission) => (
              <li key={submission.id} className="rounded-lg border bg-card p-5">
                <p className="font-mono text-sm text-muted-foreground simple:text-simple-sm">{submission.case_number}</p>
                <p className="font-bold">{submission.body}</p>
                <p className="text-sm simple:text-simple-sm">Status: {submission.status}</p>
              </li>
            ))}
          </CappedList>
          <Pagination page={submissions} href={href} label="Strony zgłoszeń" />
        </>
      ) : (
        <p>Nie masz jeszcze zgłoszeń.</p>
      )}
    </main>
  );
}
