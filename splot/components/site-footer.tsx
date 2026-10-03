import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/status", label: "Sprawdź status zgłoszenia" },
  { href: "/broker", label: "Dopasuj innowację do swojej instytucji" },
  { href: "/library", label: "Biblioteka innowacji" },
  { href: "/login", label: "Zaloguj się" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap justify-between gap-x-10 gap-y-6 px-4 py-8 sm:px-8">
        <div className="max-w-[40ch]">
          <p className="font-display text-h4 font-bold">Splot</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Innowacje społeczne Małopolski. Platforma Regionalnego Ośrodka Polityki Społecznej w
            Krakowie.
          </p>
        </div>
        <nav aria-label="Stopka">
          <ul className="flex flex-col gap-1">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-4"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
