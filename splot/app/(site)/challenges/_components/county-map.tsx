import Link from "next/link";
import { countyIndicators } from "@/lib/challenges/county-indicators";
import { CHALLENGE_CATEGORY_LABELS, type ChallengeCategory } from "@/lib/labels";
import { challengeList, countyShapes, scoreLevel } from "@/lib/library/challenges";
import { capitalize, challengesHref, levelFill, levelPattern } from "./shared";

/**
 * Choropleth of the 22 counties. Fills sit in a decorative layer; on top, one
 * link per county with a transparent fill carries the name, the click target
 * and the focus outline, so no neighbour ever covers the focused border.
 */
export function CountyMap({
  category,
  hasData,
  selected,
}: {
  category: ChallengeCategory;
  hasData: boolean;
  selected?: string;
}) {
  const counties = countyShapes.counties.map((shape) => {
    const county = countyIndicators.counties.find((item) => item.code === shape.code)!;
    const score = county.category_scores[category];
    const level = hasData && score !== undefined ? scoreLevel(score) : undefined;
    const levelText = level ? `poziom „${level.label}”` : "brak danych";
    return {
      ...shape,
      name: county.name,
      level,
      label: `${capitalize(county.name)}: ${challengeList(county.top_challenges)}. ${CHALLENGE_CATEGORY_LABELS[category]}: ${levelText}.`,
    };
  });

  return (
    <svg
      viewBox={countyShapes.viewBox}
      role="group"
      aria-label={`Mapa powiatów Małopolski: ${CHALLENGE_CATEGORY_LABELS[category].toLowerCase()}`}
      className="h-auto w-full"
    >
      <g aria-hidden>
        {counties.map(({ code, d, level }) => {
          const pattern = level && levelPattern(level);
          return (
            <g key={code}>
              <path
                d={d}
                fillRule="evenodd"
                style={{ fill: level ? levelFill(category, level) : "var(--muted)" }}
              />
              {pattern && <path d={d} fillRule="evenodd" fill={pattern} />}
              <path d={d} fillRule="evenodd" fill="none" stroke="var(--foreground)" strokeWidth={1} />
            </g>
          );
        })}
      </g>
      <g>
        {counties.map(({ code, d, label, name }) => {
          const isSelected = code === selected;
          return (
            <Link
              key={code}
              href={`${challengesHref({ view: "map", challenge: category, county: code })}#powiat`}
              scroll={false}
              aria-label={label}
              aria-current={isSelected ? "true" : undefined}
              className="group cursor-pointer"
            >
              <title>{capitalize(name)}</title>
              <path
                d={d}
                fillRule="evenodd"
                fill="transparent"
                strokeLinejoin="round"
                className="stroke-transparent stroke-[9] group-focus-visible:stroke-focus-halo"
              />
              <path
                d={d}
                fillRule="evenodd"
                fill="transparent"
                strokeLinejoin="round"
                className={
                  isSelected
                    ? "stroke-ring stroke-[4]"
                    : "stroke-transparent stroke-[3] group-hover:stroke-ring group-focus-visible:stroke-ring group-focus-visible:stroke-[4]"
                }
              />
            </Link>
          );
        })}
      </g>
    </svg>
  );
}

