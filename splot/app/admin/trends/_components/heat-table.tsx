import { CategoryBadge } from "@/components/category-badge";
import { categoryLabel, type Trends } from "@/lib/admin/trends";
import type { ChallengeCategory } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** The `--cat-*` token of each category; uncategorised rows use the text colour. */
const CATEGORY_TOKEN: Record<ChallengeCategory, string> = {
  aging: "--cat-starzenie",
  mental_health: "--cat-zdrowie",
  loneliness: "--cat-samotnosc",
  digital_exclusion: "--cat-cyfrowe",
  service_access: "--cat-uslugi",
  coordination: "--cat-koordynacja",
  depopulation: "--cat-depopulacja",
};

/** Share of the category colour per level; level 3 is the full colour with card-coloured text. */
const LEVEL_MIX = [0, 15, 40, 100] as const;

type Level = 0 | 1 | 2 | 3;

/** Thirds of the busiest cell, so the shading adapts to the volume. */
function levelBounds(max: number): [number, number] {
  return [Math.max(1, Math.ceil(max / 3)), Math.max(1, Math.ceil((max * 2) / 3))];
}

function levelOf(count: number, [low, mid]: [number, number]): Level {
  if (count === 0) return 0;
  if (count <= low) return 1;
  if (count <= mid) return 2;
  return 3;
}

function shade(category: ChallengeCategory | null, level: Level): React.CSSProperties {
  if (level === 0) return {};
  const token = category ? `var(${CATEGORY_TOKEN[category]})` : "var(--muted-foreground)";
  return { background: `color-mix(in srgb, ${token} ${LEVEL_MIX[level]}%, var(--card))` };
}

/** The legend's ranges, without the ones a small maximum leaves empty. */
function legend(max: number): { level: Level; label: string }[] {
  const [low, mid] = levelBounds(max);
  const range = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
  return [
    { level: 0 as Level, label: "0" },
    { level: 1 as Level, label: range(1, low) },
    ...(mid > low ? [{ level: 2 as Level, label: range(low + 1, mid) }] : []),
    ...(max > mid ? [{ level: 3 as Level, label: range(mid + 1, max) }] : []),
  ];
}

/**
 * Category × week as a real table: the numbers are in every cell, so the
 * shading only repeats them and the table is its own text alternative.
 */
export function HeatTable({ trends, describedBy }: { trends: Trends; describedBy: string }) {
  const max = Math.max(0, ...trends.heat.flatMap((row) => row.counts));
  const bounds = levelBounds(max);

  return (
    <div className="flex flex-col gap-4">
      {/* Scrolls on narrow screens; focusable so the keyboard can scroll it too. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Tabela zgłoszeń według kategorii i tygodni"
        className="overflow-x-auto rounded-md"
      >
        <table
          aria-describedby={describedBy}
          className="w-full min-w-[56rem] border-separate border-spacing-1 text-center"
        >
          <caption className="sr-only">
            Liczba zgłoszeń w każdej kategorii, tydzień po tygodniu. Tydzień zaczyna się w
            poniedziałek, ostatni jeszcze trwa.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="px-2 py-1 text-left font-bold">
                Kategoria
              </th>
              {trends.weeks.map((week, index) => (
                <th
                  key={week.start}
                  scope="col"
                  className="px-0.5 py-1 text-sm font-bold whitespace-nowrap text-muted-foreground"
                >
                  {week.label}
                  {index === trends.weeks.length - 1 && <span className="sr-only"> (trwa)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trends.heat.map((row) => (
              <tr key={row.category ?? "none"}>
                <th scope="row" className="py-0.5 pr-2 text-left font-normal whitespace-nowrap">
                  {row.category ? (
                    <CategoryBadge category={row.category} />
                  ) : (
                    <span className="font-bold">{categoryLabel(null)}</span>
                  )}
                </th>
                {row.counts.map((count, index) => {
                  const level = levelOf(count, bounds);
                  return (
                    <td
                      key={trends.weeks[index].start}
                      style={shade(row.category, level)}
                      className={cn(
                        "h-12 min-w-14 rounded-sm font-mono text-lg font-bold kontrast:border kontrast:border-foreground",
                        level === 0 && "font-normal text-muted-foreground",
                        level === 3 && "text-card",
                      )}
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="pt-2 pr-2 text-left font-bold">
                Razem
              </th>
              {trends.weekTotals.map((total, index) => (
                <td key={trends.weeks[index].start} className="pt-2 font-mono text-lg font-bold">
                  {total}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-bold">Zgłoszeń w tygodniu:</span>
        {legend(max).map((item) => (
          <span key={item.level} className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="h-5 w-7 rounded-sm border border-border"
              style={shade(null, item.level)}
            />
            {item.label}
          </span>
        ))}
        <span className="text-muted-foreground">
          Kolor wiersza to kategoria, im mocniejszy kolor, tym więcej. Liczba w każdym polu.
        </span>
      </div>
    </div>
  );
}
