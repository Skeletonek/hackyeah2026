import Link from "next/link";
import { HandHelping, Landmark, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  {
    href: "/match",
    label: "Mam problem",
    description: "Znajdź dopasowane innowacje społeczne.",
    icon: HandHelping,
  },
  {
    href: "/ideas/new",
    label: "Mam pomysł",
    description: "Rozwiń pomysł i zgłoś go do ROPS.",
    icon: Lightbulb,
  },
  {
    href: "/municipalities",
    label: "Szukam rozwiązania dla gminy",
    description: "Dopasuj rozwiązanie do potrzeb JST.",
    icon: Landmark,
  },
];

export function HeroActions() {
  return (
    <section aria-labelledby="hero-heading" className="flex flex-col gap-8">
      <div className="flex max-w-[68ch] flex-col gap-4">
        <h1 id="hero-heading" className="text-display simple:text-simple-h1">
          Razem rozwiążemy to szybciej
        </h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Opisz problem, znajdź sprawdzone rozwiązanie albo rozwiń własny pomysł.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.href}>
              <Button
                asChild
                size="cta"
                className="h-auto w-full min-h-24 flex-col items-start gap-1 py-5 simple:min-h-28 simple:gap-2 simple:py-6"
              >
                <Link href={action.href}>
                  <Icon aria-hidden className="size-8 simple:size-10" />
                  <span className="text-left text-h4 simple:text-simple-h4">{action.label}</span>
                  <span className="text-left text-sm font-normal simple:hidden">{action.description}</span>
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
