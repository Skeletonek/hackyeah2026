import Link from "next/link";
import { CategoryBadge } from "@/components/category-badge";
import { countyIndicators } from "@/lib/challenges/county-indicators";
import type { ChallengeCategory } from "@/lib/labels";
import {
  CHALLENGE_CATEGORIES,
  challengeList,
  scoreLevel,
  type SubmissionCounts,
} from "@/lib/library/challenges";
import { cn } from "@/lib/utils";
import { capitalize, challengesHref } from "./shared";

const CAPTION_ID = "county-table-caption";

/** BIB4b: the text alternative to the map, every county × every challenge. */
export function CountyTable({
  category,
  counts,
  selected,
}: {
  category: ChallengeCategory;
  counts: SubmissionCounts;
  selected?: string;
}) {
  return (
    // Scrolls inside its own box at 320 px; focusable so the keyboard can scroll it.
    <div
      role="region"
      aria-labelledby={CAPTION_ID}
      tabIndex={0}
      className="overflow-x-auto rounded-lg border-2 border-border bg-card"
    >
      <table className="w-full border-collapse text-left">
        <caption id={CAPTION_ID} className="px-4 pt-4 pb-2 text-left font-bold">
          Poziom wyzwań w 22 powiatach Małopolski
        </caption>
        <thead>
          <tr className="border-b-2 border-border align-bottom">
            <th scope="col" className="px-4 py-3">
              Powiat
            </th>
            <th scope="col" className="min-w-56 px-4 py-3 simple:min-w-0">
              Najważniejsze wyzwania
            </th>
            {CHALLENGE_CATEGORIES.map((item) => (
              <th
                key={item}
                scope="col"
                // Simple mode keeps the summary columns; the per-challenge levels are in the county panel.
                className={cn("px-4 py-3 simple:hidden", item === category && "bg-secondary")}
              >
                <CategoryBadge category={item} className="whitespace-nowrap" />
              </th>
            ))}
            <th scope="col" className="px-4 py-3">
              Zgłoszenia
            </th>
          </tr>
        </thead>
        <tbody>
          {countyIndicators.counties.map((county) => {
            const isSelected = county.code === selected;
            return (
              <tr
                key={county.code}
                className={isSelected ? "border-b border-border bg-accent" : "border-b border-border"}
              >
                <th scope="row" className="px-4 py-2 font-normal">
                  <Link
                    href={`${challengesHref({ view: "list", challenge: category, county: county.code })}#powiat`}
                    scroll={false}
                    aria-current={isSelected ? "true" : undefined}
                    className="inline-flex min-h-11 items-center font-bold whitespace-nowrap text-primary simple:min-h-16 simple:whitespace-normal underline underline-offset-[0.2em] hover:decoration-[3px]"
                  >
                    {capitalize(county.name)}
                  </Link>
                </th>
                <td className="px-4 py-2">{capitalize(challengeList(county.top_challenges))}</td>
                {CHALLENGE_CATEGORIES.map((item) => {
                  const score = county.category_scores[item];
                  return (
                    <td
                      key={item}
                      className={cn("px-4 py-2 whitespace-nowrap simple:hidden", item === category && "bg-secondary/60")}
                    >
                      {score === undefined ? (
                        <span className="text-muted-foreground">brak danych</span>
                      ) : (
                        scoreLevel(score).label
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-2">{counts.get(county.code)?.total ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
