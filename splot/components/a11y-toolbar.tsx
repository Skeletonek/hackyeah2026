import { Check } from "lucide-react";
import { setA11yPref } from "@/lib/a11y-actions";
import { getA11yPrefs } from "@/lib/a11y-prefs";
import { TextSizeSelect } from "@/components/a11y-text-size-select";
import { cn } from "@/lib/utils";

const TONES = {
  site: {
    base: "border-input bg-card text-foreground hover:bg-muted",
    on: "border-primary bg-primary text-primary-foreground hover:bg-primary-hover",
  },
  sidebar: {
    base: "border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    on: "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground",
  },
};

/**
 * Prościej / Kontrast toggles + Rozmiar tekstu select. Plain forms posting to
 * a server action, so they work without JS; the state lives in cookies
 * (lib/a11y-prefs.ts).
 */
export async function A11yToolbar({
  tone = "site",
  showSimple = true,
  className,
}: {
  tone?: keyof typeof TONES;
  /** `/admin` is excluded from simple mode. */
  showSimple?: boolean;
  className?: string;
}) {
  const prefs = await getA11yPrefs();

  return (
    <div role="group" aria-label="Ułatwienia dostępu" className={cn("flex flex-wrap gap-2", className)}>
      {showSimple && (
        <Switch pref="simple" value={prefs.simple ? "0" : "1"} pressed={prefs.simple} tone={tone}>
          Prościej
        </Switch>
      )}
      <Switch pref="kontrast" value={prefs.kontrast ? "0" : "1"} pressed={prefs.kontrast} tone={tone}>
        Kontrast
      </Switch>
      <TextSizeSelect defaultValue={prefs.textSize} tone={tone} />
    </div>
  );
}

function Switch({
  pref,
  value,
  pressed,
  active = pressed ?? false,
  tone,
  children,
}: {
  pref: "simple" | "kontrast";
  value: string;
  pressed?: boolean;
  active?: boolean;
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <form action={setA11yPref}>
      <input type="hidden" name="pref" value={pref} />
      <input type="hidden" name="value" value={value} />
      <button
        type="submit"
        aria-pressed={pressed}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border-2 px-3 text-sm font-bold",
          active ? TONES[tone].on : TONES[tone].base,
        )}
      >
        {active && <Check aria-hidden size={20} strokeWidth={2} />}
        {children}
      </button>
    </form>
  );
}
