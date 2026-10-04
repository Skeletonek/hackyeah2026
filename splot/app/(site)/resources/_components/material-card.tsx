import Link from "next/link";
import { ExternalLink, FileText, PlaySquare, BookOpen, LayoutTemplate } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { Button } from "@/components/ui/button";
import { getChallengeArea } from "@/lib/challenges/challenge-map";
import { type Material, type MaterialKind } from "@/lib/resources/materials";

const KIND_ICONS: Record<MaterialKind, typeof FileText> = {
  report: FileText,
  guide: BookOpen,
  canvas: LayoutTemplate,
  video: PlaySquare,
};

const KIND_LABELS: Record<MaterialKind, string> = {
  report: "Raport",
  guide: "Przewodnik",
  canvas: "Kanwa",
  video: "Wideo",
};

export function MaterialCard({ material }: { material: Material }) {
  const Icon = KIND_ICONS[material.kind];
  const isExternal = material.url.startsWith("http");
  const isVideo = material.kind === "video";

  return (
    <article
      data-slot="material-card"
      className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm kontrast:border-2 simple:gap-6 simple:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground simple:text-simple-sm">
          <Icon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
          <span className="sr-only">Rodzaj: </span>
          {KIND_LABELS[material.kind]}
        </span>
        {material.language && material.language !== "pl" && (
          <span className="text-xs font-bold uppercase text-muted-foreground simple:text-simple-sm">
            {material.language}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-h4 wrap-break-word simple:text-simple-h4">{material.title}</h3>
        <p className="text-sm text-muted-foreground simple:text-simple-sm">
          {material.year ? `${material.year} · ` : null}
          {material.publisher}
        </p>
      </div>

      <p className="text-muted-foreground simple:text-simple-base">{material.description}</p>

      <div className="flex flex-wrap gap-2">
        {material.areas.map((area) => {
          const label = getChallengeArea(area)?.title ?? area;
          return (
            <span
              key={area}
              className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground simple:px-4 simple:py-1.5 simple:text-simple-sm"
            >
              {label}
            </span>
          );
        })}
        {material.categories.map((category) => (
          <CategoryBadge key={category} category={category} />
        ))}
      </div>

      <div className="mt-auto">
        <Button asChild variant="outline" className="simple:w-full">
          <Link
            href={material.url}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            {isVideo ? "Obejrzyj" : "Pobierz / Zobacz"}
            <span className="sr-only">: {material.title}</span>
            <ExternalLink aria-hidden className="size-5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
