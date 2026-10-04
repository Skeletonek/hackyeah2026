import Link from "next/link";
import { ArrowRight, CircleCheck, FlaskConical, Lightbulb, type LucideIcon } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { Button } from "@/components/ui/button";
import { INNOVATION_STAGE_LABELS, type ChallengeCategory, type InnovationStage } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Stage as an icon next to its label; shared with the innovation page. */
export const STAGE_ICONS: Record<InnovationStage, LucideIcon> = {
  idea: Lightbulb,
  pilot: FlaskConical,
  deployed: CircleCheck,
};

/**
 * One innovation on a list or among matchmaking results. In simple mode
 * („Prościej”) only the title, lead, first badge and the link stay.
 */
export function InnovationCard({
  slug,
  title,
  lead,
  categories = [],
  stage,
  why,
  feedback,
  actions,
  headingLevel: Heading = "h3",
  className,
}: {
  slug: string;
  title: string;
  lead?: string | null;
  /** Most important first; simple mode shows only the first one. */
  categories?: ChallengeCategory[];
  stage?: InnovationStage;
  /** Content of the „Dlaczego to pasuje” block (matchmaking results). */
  why?: React.ReactNode;
  /** 👍/👎 controls, shown next to the link. */
  feedback?: React.ReactNode;
  /** Extra controls under the link, e.g. `ReadAloudButton` in simple mode. */
  actions?: React.ReactNode;
  headingLevel?: "h2" | "h3" | "h4";
  className?: string;
}) {
  const StageIcon = stage && STAGE_ICONS[stage];

  return (
    <article
      data-slot="innovation-card"
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm kontrast:border-2 simple:gap-6 simple:p-8",
        className,
      )}
    >
      {(categories.length > 0 || stage) && (
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category, index) => (
            <CategoryBadge key={category} category={category} className={cn(index > 0 && "simple:hidden")} />
          ))}
          {StageIcon && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground simple:hidden">
              <StageIcon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
              <span className="sr-only">Etap: </span>
              {INNOVATION_STAGE_LABELS[stage]}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Heading className="text-h3 wrap-break-word simple:text-simple-h3">{title}</Heading>
        {lead && <p className="max-w-[68ch] text-muted-foreground">{lead}</p>}
      </div>

      {why && (
        <div className="rounded-md bg-accent px-4 py-3 text-accent-foreground kontrast:border-2 kontrast:border-accent-foreground simple:hidden">
          <p className="font-bold">Dlaczego to pasuje</p>
          <div>{why}</div>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" className="simple:w-full">
          <Link href={`/library/${slug}`}>
            Zobacz szczegóły
            <span className="sr-only">: {title}</span>
            <ArrowRight aria-hidden />
          </Link>
        </Button>
        {feedback && <div className="flex items-center gap-2 simple:hidden">{feedback}</div>}
        {actions}
      </div>
    </article>
  );
}
