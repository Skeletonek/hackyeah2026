import { MATERIAL_KIND_LABELS, MATERIAL_KINDS, type Material, type MaterialKind } from "@/lib/resources/materials";
import { MaterialCard } from "./material-card";

export function MaterialsList({ materials }: { materials: Material[] }) {
  const byKind = MATERIAL_KINDS.reduce<Record<MaterialKind, Material[]>>((acc, kind) => {
    acc[kind] = materials
      .filter((item) => item.kind === kind)
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
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
              <span className="text-muted-foreground">({items.length})</span>
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li key={item.url}>
                  <MaterialCard material={item} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
