import type { ChallengeCategory } from "@/lib/labels";
import type { Level } from "@/lib/library/challenges";

export type View = "map" | "list";

/** The same `cat-*` tokens as CategoryBadge, so the map and the badges agree. */
export const CATEGORY_COLOR: Record<ChallengeCategory, string> = {
  aging: "var(--cat-starzenie)",
  mental_health: "var(--cat-zdrowie)",
  loneliness: "var(--cat-samotnosc)",
  digital_exclusion: "var(--cat-cyfrowe)",
  service_access: "var(--cat-uslugi)",
  coordination: "var(--cat-koordynacja)",
  depopulation: "var(--cat-depopulacja)",
};

/** Share of the category colour per level; the rest is `card`, so Kontrast flips it on its own. */
const LEVEL_MIX: Record<Level["key"], number> = { low: 12, medium: 40, high: 70, very_high: 100 };

export function levelFill(category: ChallengeCategory, level: Level) {
  return `color-mix(in srgb, ${CATEGORY_COLOR[category]} ${LEVEL_MIX[level.key]}%, var(--card))`;
}

/** Pattern id per level (defined once in PatternDefs); the low level has none. */
export function levelPattern(level: Level) {
  return level.key === "low" ? undefined : `url(#challenge-pattern-${level.key})`;
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const numberFormat = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 });

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

/** 1 zgłoszenie, 2–4 zgłoszenia (but 12–14 zgłoszeń), 5+ zgłoszeń. */
export function pluralSubmissions(count: number) {
  if (count === 1) return "zgłoszenie";
  const ones = count % 10;
  const tens = count % 100;
  return ones >= 2 && ones <= 4 && (tens < 12 || tens > 14) ? "zgłoszenia" : "zgłoszeń";
}

export function challengesHref({
  view,
  challenge,
  county,
}: {
  view: View;
  challenge: ChallengeCategory;
  county?: string;
}) {
  const params = new URLSearchParams();
  if (view === "list") params.set("view", "list");
  params.set("challenge", challenge);
  if (county) params.set("county", county);
  return `/challenges?${params.toString()}`;
}
