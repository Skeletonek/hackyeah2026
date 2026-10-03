import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible_Mono,
  Atkinson_Hyperlegible_Next,
  Bricolage_Grotesque,
} from "next/font/google";
import { getA11yPrefs } from "@/lib/a11y-prefs";
import { cn } from "@/lib/utils";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
});

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
});

const atkinsonMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-atkinson-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Splot — innowacje społeczne Małopolski",
    template: "%s · Splot",
  },
  description:
    "Opisz problem, znajdź gotowe rozwiązanie albo zgłoś pomysł. Platforma ROPS w Krakowie.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Applied on the server from cookies, so nothing flashes on load.
  const prefs = await getA11yPrefs();

  return (
    <html
      lang="pl"
      data-theme={prefs.kontrast ? "kontrast" : undefined}
      data-mode={prefs.simple ? "simple" : undefined}
      className={cn(
        bricolage.variable,
        atkinson.variable,
        atkinsonMono.variable,
        "h-full antialiased",
        prefs.textSize !== "normal" && prefs.textSize,
      )}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:font-bold focus:text-primary-foreground"
        >
          Przejdź do treści
        </a>
        {children}
      </body>
    </html>
  );
}
