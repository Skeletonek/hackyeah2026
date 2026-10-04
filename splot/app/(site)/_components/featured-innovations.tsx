import { InnovationCard } from "@/components/innovation-card";
import type { ChallengeCategory, InnovationStage } from "@/lib/labels";

export type FeaturedInnovation = {
  id: string;
  slug: string;
  title: string;
  lead: string | null;
  categories: ChallengeCategory[];
  stage: InnovationStage;
};

export function FeaturedInnovations({ innovations }: { innovations: FeaturedInnovation[] }) {
  if (innovations.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
      <h2 id="featured-heading" className="text-h2 simple:text-simple-h2">
        Polecane innowacje
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {innovations.map((innovation) => (
          <li key={innovation.id}>
            <InnovationCard
              slug={innovation.slug}
              title={innovation.title}
              lead={innovation.lead}
              categories={innovation.categories}
              stage={innovation.stage}
              headingLevel="h3"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
