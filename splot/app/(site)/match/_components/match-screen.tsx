import { z } from "zod";
import library from "@/data/rops-library.json";
import { loadConversationMessages } from "@/lib/ai/conversations";
import { getCurrentUser } from "@/lib/auth";
import { MATCH_COPY } from "@/lib/matchmaking/copy";
import { matchmakingContext, type MatchmakingContext } from "@/lib/matchmaking/skill";
import { createClient } from "@/lib/supabase/server";
import { MatchFlow } from "./match-flow";

type SearchParam = string | string[] | undefined;

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

/**
 * The matchmaking screen shared by `/match` (resident) and `/municipalities`
 * (municipality official): same flow, copy and examples by `role`.
 */
export async function MatchScreen({
  role,
  searchParams,
}: {
  role: MatchmakingContext["role"];
  searchParams: Promise<{ c?: SearchParam; m?: SearchParam }>;
}) {
  const { c, m } = await searchParams;
  const copy = MATCH_COPY[role];

  // `?c=` appears after the first message; until then every visit gets a fresh id.
  const id = z.uuid().safeParse(c);
  // `?m=` keeps the municipality given on the entry screen across a reload.
  const municipality = matchmakingContext.shape.municipality.safeParse(m);
  const [initialMessages, innovationCount, user] = await Promise.all([
    id.success ? loadConversationMessages("matchmaking", id.data) : [],
    countInnovations(),
    getCurrentUser(),
  ]);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 simple:text-simple-h1">{copy.title}</h1>
          <p className="text-lead text-muted-foreground simple:text-simple-lead">{copy.intro}</p>
        </div>
        <MatchFlow
          conversationId={id.success ? id.data : crypto.randomUUID()}
          initialMessages={initialMessages}
          role={role}
          initialMunicipality={municipality.success ? municipality.data : undefined}
          innovationCount={innovationCount}
          hasAccount={user !== null && !user.isAnonymous}
        />
      </div>
    </main>
  );
}
