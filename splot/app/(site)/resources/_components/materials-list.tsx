import { CappedList } from "@/components/capped-list";
import { MATERIAL_KIND_LABELS, MATERIAL_KINDS, type Material, type MaterialKind } from "@/lib/resources/materials";
import { MaterialCard } from "./material-card";

/** One page of materials, grouped by kind; `totals` counts each kind across all pages. */
export function MaterialsList({
  materials,
  totals,
}: {
  materials: Material[];
  totals: Record<MaterialKind, number>;
}) {
  const byKind = MATERIAL_KINDS.reduce<Record<MaterialKind, Material[]>>((acc, kind) => {
    acc[kind] = materials.filter((item) => item.kind === kind);
    return acc;
  }, { report: [], guide: [], canvas: [], video: [] });

  return (
    <div className="flex flex-col gap-10 simple:gap-12">
      {MATERIAL_KINDS.map((kind) => {
        const items = byKind[kind];
        if (items.length === 0) return null;

        return (
          <section key={kind} aria-labelledby={`kind-heading-${kind}`} className="flex flex-col gap-4">
            <h2 id={`kind-heading-${kind}`} className="text-h2 simple:text-simple-h2">
              {MATERIAL_KIND_LABELS[kind]}{" "}
              <span className="text-muted-foreground">({totals[kind]})</span>
            </h2>
            {/* Masonry via CSS columns: DOM order runs down each column, so focus and reading order match the visual order. */}
            <CappedList className="-mb-4 columns-1 gap-4 sm:columns-2 lg:columns-3 simple:sm:columns-1 simple:lg:columns-1">
              {items.map((item) => (
                <li key={item.url} className="mb-4 break-inside-avoid">
                  <MaterialCard material={item} />
                </li>
              ))}
            </CappedList>
          </section>
        );
      })}
    </div>
  );
}
