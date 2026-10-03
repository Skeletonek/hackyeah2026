import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { A11yToolbar } from "@/components/a11y-toolbar";
import { NavLink } from "@/components/nav-link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getCurrentUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/match", label: "Mam problem" },
  { href: "/ideas/new", label: "Mam pomysł" },
  { href: "/library", label: "Biblioteka innowacji" },
  { href: "/challenges", label: "Mapa wyzwań" },
  { href: "/resources", label: "Materiały" },
  { href: "/municipalities", label: "Dla gmin" },
];

const NAV_LINK_CLASS =
  "inline-flex min-h-11 items-center rounded-md px-3 font-bold underline-offset-4 hover:underline aria-[current=page]:bg-secondary aria-[current=page]:text-secondary-foreground aria-[current=page]:underline";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const signedIn = user !== null && !user.isAnonymous;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md">
          <Image
            src="/logo/splot-logo-horizontal-light.svg"
            alt=""
            width={123}
            height={48}
            priority
            className="h-12 w-auto kontrast:hidden"
          />
          <Image
            src="/logo/splot-logo-horizontal-dark.svg"
            alt=""
            width={123}
            height={48}
            priority
            className="hidden h-12 w-auto kontrast:block"
          />
          <span className="sr-only">Splot, strona główna</span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <A11yToolbar />
          <NotificationBell />
          {signedIn && user.profile?.role === "admin" && (
            <Link href="/admin" className={NAV_LINK_CLASS}>
              Panel ROPS
            </Link>
          )}
          {signedIn ? (
            <NavLink href="/account" className={NAV_LINK_CLASS}>
              Moje konto
            </NavLink>
          ) : (
            <NavLink href="/login" className={NAV_LINK_CLASS}>
              Zaloguj się
            </NavLink>
          )}
        </div>
      </div>

      <nav aria-label="Główna" className="border-t">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
          <ul className="hidden flex-wrap gap-x-2 py-2 md:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} className={NAV_LINK_CLASS}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {/* <details> opens without JS. */}
          <details className="py-2 md:hidden">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-3 font-bold [&::-webkit-details-marker]:hidden">
              <Menu aria-hidden size={24} strokeWidth={2} />
              Menu
            </summary>
            <ul className="flex flex-col gap-1 pt-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} className={`${NAV_LINK_CLASS} w-full`}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </nav>
    </header>
  );
}
