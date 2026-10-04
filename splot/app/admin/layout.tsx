import Link from "next/link";
import { A11yToolbar } from "@/components/a11y-toolbar";
import { AdminMenu } from "@/components/admin-menu";
import { SignOutButton } from "@/components/sign-out-button";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole(["admin"], "/admin");

  return (
    <div className="flex min-h-full flex-1 flex-col md:block">
      {/* The focus ring uses the sidebar tokens on the dark background. */}
      <nav
        aria-label="Panel ROPS"
        className="flex shrink-0 flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground [--background:var(--sidebar)] [--focus-halo:transparent] [--ring:var(--sidebar-ring)] md:fixed md:inset-y-0 md:left-0 md:w-72 md:p-6"
      >
        <div className="shrink-0">
          <p className="font-display text-h4 font-bold">Panel ROPS</p>
          <p className="mt-1 text-sm break-words">{user.profile?.display_name ?? user.email}</p>
        </div>
        <div className="md:min-h-0 md:flex-1 md:overflow-y-auto">
          <AdminMenu />
        </div>
        <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-sidebar-border pt-4">
          <A11yToolbar tone="sidebar" showSimple={false} />
          <Link
            href="/"
            className="inline-flex min-h-11 items-center px-3 font-bold underline underline-offset-4"
          >
            Wróć do serwisu
          </Link>
          <div className="[&_button]:text-sidebar-foreground">
            <SignOutButton />
          </div>
        </div>
      </nav>
      <div className="min-w-0 flex-1 md:pl-72">{children}</div>
    </div>
  );
}
