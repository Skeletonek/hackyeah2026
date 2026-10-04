import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { CappedList } from "@/components/capped-list";
import { EmptyState } from "@/components/empty-state";
import { InnovationCard } from "@/components/innovation-card";
import { Button } from "@/components/ui/button";
import { hasFilters, listInnovations, parseLibraryFilters } from "@/lib/library/queries";
import { LibraryFilters } from "./_components/library-filters";

const TITLE = "Biblioteka innowacji";

export const metadata: Metadata = { title: TITLE };

/** „1 innowację”, „2 innowacje”, „5 innowacji”, „22 innowacje”, „12 innowacji”. */
function innovationsCount(count: number) {
  if (count === 1) return "1 innowację";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  const few = lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14);
  return `${count} ${few ? "innowacje" : "innowacji"}`;
}

export default async function Page({ searchParams }: PageProps<"/library">) {
  const filters = parseLibraryFilters(await searchParams);
  const filtered = hasFilters(filters);
  const innovations = await listInnovations(filters);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-10 sm:px-8">
      <div className="flex max-w-[68ch] flex-col gap-3">
        <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Rozwiązania z Biblioteki Innowacji Społecznych ROPS Kraków. Wyszukaj albo wybierz
          wyzwanie, odbiorców i etap.
        </p>
      </div>

      <LibraryFilters filters={filters} showClear={filtered} />

      <section aria-labelledby="results-heading" className="flex flex-col gap-5">
        <h2 id="results-heading" className="sr-only">
          Wyniki
        </h2>
        <div role="status" className="flex flex-col gap-1">
          <p className="text-h4 simple:text-simple-h4">
            Znaleziono {innovationsCount(innovations.length)}
            {filters.q && <> dla „{filters.q}”</>}
          </p>
          {filters.q && innovations.length > 0 && (
            <p className="text-muted-foreground simple:hidden">Najlepiej pasujące są na początku.</p>
          )}
        </div>

        {innovations.length > 0 ? (
          <CappedList className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 simple:sm:grid-cols-1 simple:lg:grid-cols-1">
            {innovations.map((innovation) => (
              <li key={innovation.id} className="flex min-w-0">
                <InnovationCard
                  slug={innovation.slug}
                  title={innovation.title}
                  lead={innovation.lead}
                  categories={innovation.categories}
                  stage={innovation.stage}
                  className="w-full"
                />
              </li>
            ))}
          </CappedList>
        ) : (
          <EmptyState
            title="Nie znaleźliśmy takiej innowacji"
            headingLevel="h3"
            action={
              <>
                <Button asChild className="max-w-full whitespace-normal">
                  <Link href="/match">
                    <MessageSquareText aria-hidden />
                    Opisz problem — dopasujemy rozwiązanie
                  </Link>
                </Button>
                {filtered && (
                  <Button asChild variant="outline">
                    <Link href="/library">Wyczyść filtry</Link>
                  </Button>
                )}
              </>
            }
          >
            Spróbuj innych słów albo mniej filtrów. Możesz też opisać swój problem własnymi słowami, a my poszukamy
            pasującego rozwiązania.
          </EmptyState>
        )}
      </section>
    </main>
  );
}
