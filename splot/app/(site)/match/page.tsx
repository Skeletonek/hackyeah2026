import type { Metadata } from "next";
import { z } from "zod";
import library from "@/data/rops-library.json";
import { loadConversationMessages } from "@/lib/ai/conversations";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MatchFlow } from "./_components/match-flow";

const TITLE = "Mam problem";

export const metadata: Metadata = { title: TITLE };

async function countInnovations() {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("innovations")
      .select("id", { count: "exact", head: true })
      .eq("published", true);
    if (count) return count;
  } catch {
    // Local JSON below.
  }
  return (library as unknown[]).length;
}

export default async function Page({ searchParams }: PageProps<"/match">) {
  const { c, role } = await searchParams;

  // `?c=` appears after the first message; until then every visit gets a fresh id.
  const id = z.uuid().safeParse(c);
  const [initialMessages, innovationCount, user] = await Promise.all([
    id.success ? loadConversationMessages("matchmaking", id.data) : [],
    countInnovations(),
    getCurrentUser(),
  ]);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
          <p className="text-lead text-muted-foreground simple:text-simple-lead">
            Opisz, co jest trudne. Poszukamy sprawdzonych rozwiązań z Małopolski.
          </p>
        </div>
        <MatchFlow
          conversationId={id.success ? id.data : crypto.randomUUID()}
          initialMessages={initialMessages}
          role={role === "municipality" ? "municipality" : "resident"}
          innovationCount={innovationCount}
          hasAccount={user !== null && !user.isAnonymous}
        />
      </div>
    </main>
  );
}
