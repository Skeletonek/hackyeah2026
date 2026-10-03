import Link from "next/link";
import { List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { CHALLENGE_CATEGORY_LABELS, type ChallengeCategory } from "@/lib/labels";
import { CHALLENGE_CATEGORIES, hasCountyData } from "@/lib/library/challenges";
import { challengesHref, type View } from "./shared";

/** GET form, so it works without JS; changing the select alone never reloads the page. */
export function ChallengePicker({
  view,
  category,
  county,
}: {
  view: View;
  category: ChallengeCategory;
  county?: string;
}) {
  return (
    <form action="/challenges" className="flex flex-wrap items-end gap-3">
      {view === "list" && <input type="hidden" name="view" value="list" />}
      {county && <input type="hidden" name="county" value={county} />}
      <Field label="Wyzwanie na mapie" className="w-full sm:w-80">
        <Select name="challenge" defaultValue={category}>
          {CHALLENGE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {CHALLENGE_CATEGORY_LABELS[item]}
              {hasCountyData(item) ? "" : " (brak danych)"}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" variant="outline">
        Pokaż
      </Button>
    </form>
  );
}

const VIEWS = [
  { view: "map", label: "Mapa", icon: MapIcon },
  { view: "list", label: "Lista", icon: List },
] as const;

/** „Mapa / Lista” as links (`?view=list`), so each view has its own URL and works without JS. */
export function ViewTabs({
  view,
  category,
  county,
}: {
  view: View;
  category: ChallengeCategory;
  county?: string;
}) {
  return (
    <nav aria-label="Widok mapy wyzwań">
      <ul className="flex gap-x-1 border-b-2 border-border">
        {VIEWS.map((item) => {
          const active = item.view === view;
          const Icon = item.icon;
          return (
            <li key={item.view}>
              <Link
                href={challengesHref({ view: item.view, challenge: category, county })}
                aria-current={active ? "page" : undefined}
                // The active view is marked by the thick underline, not by colour alone (as in Tabs).
                className={
                  active
                    ? "-mb-0.5 inline-flex min-h-11 items-center gap-2 rounded-t-sm border-b-4 border-primary px-4 font-bold text-foreground simple:min-h-16 simple:px-5"
                    : "-mb-0.5 inline-flex min-h-11 items-center gap-2 rounded-t-sm border-b-4 border-transparent px-4 font-bold text-muted-foreground hover:border-input hover:text-foreground simple:min-h-16 simple:px-5"
                }
              >
                <Icon aria-hidden className="size-6" strokeWidth={2} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
