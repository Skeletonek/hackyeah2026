import { CategoryBadge } from "@/components/category-badge";
import type { ChallengeCategory } from "@/lib/labels";
import { LEVELS, type Level } from "@/lib/library/challenges";
import { levelFill, levelPattern } from "./shared";

const LEVEL_HINTS: Record<Level["key"], string> = {
  low: "łagodniej niż w większości regionu",
  medium: "poniżej środka regionu",
  high: "powyżej środka regionu",
  very_high: "najtrudniej w regionie",
};

/**
 * Hatching per level, so the map does not rely on colour alone. Dots sit on
 * the light fill, lines on the dark ones; Kontrast swaps `card`/`foreground`.
 */
export function PatternDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <pattern id="challenge-pattern-medium" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.3" fill="var(--foreground)" />
        </pattern>
        <pattern
          id="challenge-pattern-high"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--card)" strokeWidth="2" />
        </pattern>
        <pattern
          id="challenge-pattern-very_high"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--card)" strokeWidth="2" />
          <line x1="0" y1="0" x2="7" y2="0" stroke="var(--card)" strokeWidth="2" />
        </pattern>
      </defs>
    </svg>
  );
}

export function LevelSwatch({ category, level }: { category: ChallengeCategory; level: Level }) {
  const pattern = levelPattern(level);
  return (
    <svg aria-hidden viewBox="0 0 40 28" className="h-7 w-10 shrink-0 rounded-sm">
      <rect width="40" height="28" style={{ fill: levelFill(category, level) }} />
      {pattern && <rect width="40" height="28" fill={pattern} />}
      <rect x="1" y="1" width="38" height="26" fill="none" stroke="var(--input)" strokeWidth="2" />
    </svg>
  );
}

export function MapLegend({ category }: { category: ChallengeCategory }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2 font-bold">
        Poziom wyzwania <CategoryBadge category={category} />
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {LEVELS.map((level) => (
          <li key={level.key} className="flex items-center gap-3">
            <LevelSwatch category={category} level={level} />
            <span>
              <span className="font-bold">{level.label}</span>
              <span className="text-muted-foreground">: {LEVEL_HINTS[level.key]}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
