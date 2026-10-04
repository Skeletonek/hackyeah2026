import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { easy: false, label: "Pełny opis", href: "?easy=0" },
  { easy: true, label: "Wersja łatwa do czytania", href: "?easy=1" },
] as const;

/**
 * Full description ↔ easy-read. Plain links (`?easy=`), so it works without
 * JavaScript and the chosen version can be shared.
 */
export function EasyReadToggle({ easy }: { easy: boolean }) {
  return (
    <ul aria-label="Wersja opisu" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const current = option.easy === easy;
        return (
          <li key={option.href}>
            <Link
              href={option.href}
              replace
              scroll={false}
              aria-current={current ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold simple:min-h-16 simple:px-5 simple:text-simple-sm",
                current
                  ? "border-primary bg-primary text-primary-foreground kontrast:border-primary-foreground"
                  : "border-input bg-card text-foreground hover:border-primary hover:bg-secondary",
              )}
            >
              {current && <Check aria-hidden className="size-5 shrink-0" strokeWidth={2.5} />}
              {option.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
