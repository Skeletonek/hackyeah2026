import { NavLink } from "@/components/nav-link";

const ACCOUNT_ITEMS = [
  { href: "/account", label: "Zgłoszenia", exact: true },
  { href: "/account/ideas", label: "Moje pomysły" },
  { href: "/account/messages", label: "Wiadomości" },
  { href: "/account/partners", label: "Szukam partnera" },
  { href: "/account/consultations", label: "Konsultacje" },
];

export function AccountNav() {
  return (
    <nav aria-label="Moje konto">
      <ul className="flex flex-wrap gap-x-2 gap-y-1">
        {ACCOUNT_ITEMS.map((item) => (
          <li key={item.href}>
            <NavLink
              href={item.href}
              exact={item.exact}
              className="inline-flex min-h-11 items-center border-b-4 border-transparent px-3 font-bold hover:border-input aria-[current=page]:border-primary aria-[current=page]:text-primary"
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
