import type { Metadata } from "next";
import { Pagination } from "@/components/pagination";
import { pageHref, parsePage, slicePage } from "@/lib/pagination";
import {
  areaKey,
  challengeCategoryEnum,
  filterMaterials,
  MATERIAL_KINDS,
  type MaterialKind,
} from "@/lib/resources/materials";
import { FilterBar } from "./_components/filter-bar";
import { MaterialsList } from "./_components/materials-list";

const TITLE = "Materiały";

export const metadata: Metadata = { title: TITLE };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const areaParam = first(params.area);
  const categoryParam = first(params.category);

  const areaParse = areaParam ? areaKey.safeParse(areaParam) : null;
  const categoryParse = categoryParam ? challengeCategoryEnum.safeParse(categoryParam) : null;
  const selectedArea = areaParse?.success ? areaParse.data : undefined;
  const selectedCategory = categoryParse?.success ? categoryParse.data : undefined;

  // Filters run on the whole set; only the current page goes to the browser.
  const filteredMaterials = filterMaterials({ area: selectedArea, category: selectedCategory });
  const href = (n: number) => pageHref("/resources", params, n);
  const page = slicePage(filteredMaterials, parsePage(params), href);
  const totals = Object.fromEntries(
    MATERIAL_KINDS.map((kind) => [kind, filteredMaterials.filter((item) => item.kind === kind).length]),
  ) as Record<MaterialKind, number>;

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-10 sm:px-8"
    >
      <div className="flex max-w-[68ch] flex-col gap-3">
        <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Raporty, przewodniki, kanwy i filmy ROPS Kraków. Przefiltruj według obszaru lub wyzwania.
        </p>
      </div>

      <FilterBar selectedArea={selectedArea} selectedCategory={selectedCategory} />

      {filteredMaterials.length === 0 ? (
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Brak materiałów dla wybranych filtrów.
        </p>
      ) : (
        <>
          <MaterialsList materials={page.items} totals={totals} />
          <Pagination page={page} href={href} label="Strony materiałów" />
        </>
      )}
    </main>
  );
}
