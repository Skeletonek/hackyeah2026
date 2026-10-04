import { cn } from "@/lib/utils";

export type Bar = { key: string; label: React.ReactNode; count: number };

/**
 * Horizontal HTML/CSS bars. The number is always text beside the bar, so the
 * bar itself is decoration and hidden from screen readers.
 */
export function BarList({
  bars,
  total,
  ordered = false,
  barClassName = "bg-primary",
}: {
  bars: Bar[];
  /** Base of the percentage in the text. */
  total: number;
  /** A ranking (`<ol>`) rather than a plain list. */
  ordered?: boolean;
  barClassName?: string;
}) {
  const max = Math.max(1, ...bars.map((bar) => bar.count));
  const List = ordered ? "ol" : "ul";

  return (
    <List className="flex flex-col gap-3">
      {bars.map((bar) => (
        <li
          key={bar.key}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(9rem,14rem)_minmax(0,1fr)_auto]"
        >
          <span className="min-w-0 font-bold break-words">{bar.label}</span>
          <span
            aria-hidden
            className="order-last col-span-2 h-5 overflow-hidden rounded-r-sm bg-muted kontrast:border kontrast:border-foreground sm:order-none sm:col-span-1"
          >
            <span
              className={cn("block h-full rounded-r-sm", barClassName)}
              style={{ width: `${(bar.count / max) * 100}%` }}
            />
          </span>
          <span className="text-right font-mono font-bold whitespace-nowrap">
            {bar.count}
            <span className="font-sans text-sm font-normal text-muted-foreground">
              {" "}
              ({percent(bar.count, total)})
            </span>
          </span>
        </li>
      ))}
    </List>
  );
}

const PERCENT = new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits: 0 });

export function percent(count: number, total: number): string {
  return PERCENT.format(total > 0 ? count / total : 0);
}
