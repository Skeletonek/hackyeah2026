import { createClient } from "@/lib/supabase/server";
import type { InnovationStage } from "@/lib/labels";
import { ActiveCallBanner } from "./_components/active-call-banner";
import { FeaturedInnovations } from "./_components/featured-innovations";
import { HeroActions } from "./_components/hero-actions";
import { SearchForm } from "./_components/search-form";

const STAGE_ORDER: Record<InnovationStage, number> = {
  deployed: 0,
  pilot: 1,
  idea: 2,
};

export default async function HomePage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [activeCallResult, innovationsResult] = await Promise.all([
    supabase
      .from("grant_calls")
      .select("id, title, closes_at")
      .lte("opens_at", now)
      .gte("closes_at", now)
      .maybeSingle(),
    supabase
      .from("innovations")
      .select("id, slug, title, lead, categories, stage")
      .eq("published", true)
      .limit(12),
  ]);

  const activeCall = activeCallResult.data;

  const featuredInnovations = (innovationsResult.data ?? [])
    .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage])
    .slice(0, 3);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-12 sm:px-8"
    >
      <HeroActions />
      <SearchForm />

      <div className="flex flex-col gap-10 simple:hidden">
        {activeCall && (
          <ActiveCallBanner id={activeCall.id} title={activeCall.title} closesAt={activeCall.closes_at} />
        )}
        <FeaturedInnovations innovations={featuredInnovations} />
      </div>
    </main>
  );
}
