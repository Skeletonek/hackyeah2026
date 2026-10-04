import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import libraryFallback from "@/data/rops-library.json";
import { BrokerForm } from "./_components/form";

const TITLE = "Dopasuj innowację do swojej instytucji";

export const metadata: Metadata = { title: TITLE };

type InnovationRow = { slug: string; title: string };

async function loadInnovations(): Promise<InnovationRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("innovations")
      .select("slug, title")
      .eq("published", true)
      .order("title")
      .limit(200);
    if (data?.length) return data as InnovationRow[];
  } catch {
    // Local JSON below.
  }
  const items = libraryFallback as { slug: string; title: string }[];
  return items
    .map(({ slug, title }) => ({ slug, title }))
    .sort((a, b) => a.title.localeCompare(b.title, "pl"));
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.innovation) ? params.innovation[0] : params.innovation;
  const innovations = await loadInnovations();
  const initialSlug = innovations.some((item) => item.slug === requested) ? (requested as string) : "";

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex max-w-[68ch] flex-col gap-3">
        <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Wybierz innowację i opisz gminę w 5 polach. Przygotujemy plan usługi.
        </p>
      </div>
      <BrokerForm innovations={innovations} initialSlug={initialSlug} />
    </main>
  );
}
