import { NavLink } from "@/components/nav-link";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ITEMS = [
  { href: "/admin/submissions", label: "Zgłoszenia" },
  { href: "/admin/messages", label: "Wiadomości" },
  { href: "/admin/library", label: "Biblioteka" },
  { href: "/admin/pilots", label: "Pilotaże" },
  { href: "/admin/calls", label: "Nabory" },
  { href: "/admin/trends", label: "Trendy" },
  { href: "/admin/connections", label: "Prośby o połączenie" },
];

export async function AdminMenu() {
  const supabase = await createClient();
  // New = not yet picked up by ROPS.
  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "received");
  const newSubmissions = count ?? 0;

  return (
    <ul className="flex flex-col gap-1">
      {ADMIN_ITEMS.map((item) => (
        <li key={item.href}>
          <NavLink
            href={item.href}
            className="group flex min-h-11 items-center justify-between gap-3 rounded-md px-3 font-bold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-[current=page]:bg-sidebar-primary aria-[current=page]:text-sidebar-primary-foreground aria-[current=page]:underline"
          >
            {item.label}
            {item.href === "/admin/submissions" && newSubmissions > 0 && (
              <span className="inline-flex min-w-7 justify-center rounded-full bg-sidebar-primary px-2 text-sm text-sidebar-primary-foreground group-aria-[current=page]:bg-sidebar group-aria-[current=page]:text-sidebar-foreground">
                {newSubmissions}
                <span className="sr-only"> nowych</span>
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
