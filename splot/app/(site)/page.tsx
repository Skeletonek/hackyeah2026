import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: innovations } = await supabase
    .from("innovations")
    .select("id, slug, title, lead")
    .eq("published", true)
    .limit(3);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-12 sm:px-8">
      <h1 className="text-display">Razem rozwiążemy to szybciej</h1>
      <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
        <h2 id="featured-heading" className="text-h2">Polecane innowacje</h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {innovations?.map((innovation) => (
            <li key={innovation.id} className="rounded-lg border bg-card p-5 shadow-sm">
              <h3 className="text-h4">{innovation.title}</h3>
              <p className="mt-2 text-sm">{innovation.lead}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
