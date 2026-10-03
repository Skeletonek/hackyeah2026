import { Check } from "lucide-react";
import { setA11yPref } from "@/lib/a11y-actions";
import { getA11yPrefs, type TextSize } from "@/lib/a11y-prefs";
import { cn } from "@/lib/utils";

const NEXT_TEXT_SIZE: Record<TextSize, TextSize> = {
  normal: "a-plus",
  "a-plus": "a-plusplus",
  "a-plusplus": "normal",
};

const TEXT_SIZE_LABEL: Record<TextSize, { visible: string; state: string }> = {
  normal: { visible: "A+", state: "Rozmiar tekstu: zwykły" },
  "a-plus": { visible: "A+", state: "Rozmiar tekstu: większy" },
  "a-plusplus": { visible: "A++", state: "Rozmiar tekstu: największy" },
};

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
 * Prościej / Kontrast / A+ switches. Plain forms posting to a server action,
 * so they work without JS; the state lives in cookies (lib/a11y-prefs.ts).
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
  const textSize = TEXT_SIZE_LABEL[prefs.textSize];

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
      <Switch
        pref="textSize"
        value={NEXT_TEXT_SIZE[prefs.textSize]}
        active={prefs.textSize !== "normal"}
        tone={tone}
      >
        {textSize.visible}
        <span className="sr-only">. {textSize.state}. Zmień</span>
      </Switch>
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
  pref: "simple" | "kontrast" | "textSize";
  value: string;
  /** Set for two-state switches; omit for the three-step text size. */
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
