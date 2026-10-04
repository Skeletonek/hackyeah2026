import Link from "next/link";
import { FlaskConical, MessageSquareText, type LucideIcon } from "lucide-react";
import type { PilotTab } from "@/lib/admin/pilots";

const TABS = [
  { tab: "applications", label: "Zgłoszenia do testów", icon: FlaskConical, countLabel: "nowych" },
  { tab: "reviews", label: "Opinie do akceptacji", icon: MessageSquareText, countLabel: "do akceptacji" },
] as const satisfies readonly { tab: PilotTab; label: string; icon: LucideIcon; countLabel: string }[];

/** The two tabs as links (`?tab=reviews`), so each has its own URL and works without JS. */
export function PilotTabs({ tab, counts }: { tab: PilotTab; counts: Record<PilotTab, number> }) {
  return (
    <nav aria-label="Pilotaże">
      <ul className="flex flex-wrap gap-x-1 border-b-2 border-border">
        {TABS.map((item) => {
          const active = item.tab === tab;
          const Icon = item.icon;
          const count = counts[item.tab];
          return (
            <li key={item.tab}>
              <Link
                href={item.tab === "applications" ? "/admin/pilots" : `/admin/pilots?tab=${item.tab}`}
                aria-current={active ? "page" : undefined}
                // The active tab is marked by the thick underline, not by colour alone (as in Tabs).
                className={
                  active
                    ? "-mb-0.5 inline-flex min-h-11 items-center gap-2 rounded-t-sm border-b-4 border-primary px-4 font-bold text-foreground"
                    : "-mb-0.5 inline-flex min-h-11 items-center gap-2 rounded-t-sm border-b-4 border-transparent px-4 font-bold text-muted-foreground hover:border-input hover:text-foreground"
                }
              >
                <Icon aria-hidden className="size-6 shrink-0" strokeWidth={2} />
                {item.label}
                {count > 0 && (
                  <span className="inline-flex min-w-7 justify-center rounded-full bg-primary px-2 text-sm text-primary-foreground">
                    {count}
                    <span className="sr-only"> {item.countLabel}</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
