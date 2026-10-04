import type { Metadata } from "next";
import { areaKey, challengeCategoryEnum, materials } from "@/lib/resources/materials";
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

  const filteredMaterials = materials.filter((item) => {
    if (selectedArea && !item.areas.includes(selectedArea)) return false;
    if (selectedCategory && !item.categories.includes(selectedCategory)) return false;
    return true;
  });

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
        <MaterialsList materials={filteredMaterials} />
      )}
    </main>
  );
}
