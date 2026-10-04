import Link from "next/link";
import { getChallengeArea } from "@/lib/challenges/challenge-map";
import { CHALLENGE_CATEGORY_LABELS } from "@/lib/labels";
import { materials } from "@/lib/resources/materials";
import { cn } from "@/lib/utils";

function buildHref(params: { area?: string; category?: string }) {
  const search = new URLSearchParams();
  if (params.area) search.set("area", params.area);
  if (params.category) search.set("category", params.category);
  const qs = search.toString();
  return qs ? `/resources?${qs}` : "/resources";
}

const FILTER_LINK_CLASS =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground hover:border-foreground hover:bg-muted simple:min-h-16 simple:px-5 simple:text-simple-sm";

export function FilterBar({
  selectedArea,
  selectedCategory,
}: {
  selectedArea?: string;
  selectedCategory?: string;
}) {
  const areas = Array.from(new Set(materials.flatMap((m) => m.areas))).sort();
  const categories = Array.from(new Set(materials.flatMap((m) => m.categories))).sort(
    (a, b) => CHALLENGE_CATEGORY_LABELS[a].localeCompare(CHALLENGE_CATEGORY_LABELS[b]),
  );

  return (
    <div className="flex flex-col gap-4">
      {areas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold simple:text-simple-sm">Obszar:</span>
          {areas.map((area) => {
            const active = area === selectedArea;
            const label = getChallengeArea(area)?.title ?? area;
            return (
              <Link
                key={area}
                href={buildHref({ area: active ? undefined : area, category: selectedCategory })}
                aria-pressed={active}
                className={cn(FILTER_LINK_CLASS, "border-input bg-card text-foreground")}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold simple:text-simple-sm">Wyzwanie:</span>
          {categories.map((category) => {
            const active = category === selectedCategory;
            return (
              <Link
                key={category}
                href={buildHref({ area: selectedArea, category: active ? undefined : category })}
                aria-pressed={active}
                className={cn(FILTER_LINK_CLASS, "border-input bg-card text-foreground")}
              >
                {CHALLENGE_CATEGORY_LABELS[category]}
              </Link>
            );
          })}
        </div>
      )}

      {(selectedArea || selectedCategory) && (
        <Link
          href="/resources"
          className="inline-flex min-h-11 items-center self-start rounded-md border-2 border-primary px-4 text-sm font-bold text-primary hover:bg-secondary simple:min-h-16 simple:px-5 simple:text-simple-sm"
        >
          Wyczyść filtry
        </Link>
      )}
    </div>
  );
}
