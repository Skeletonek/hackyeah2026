import { SignOutButton } from "@/components/sign-out-button";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole(["admin"], "/admin");

  return (
    <div className="flex min-h-full flex-1">
      <nav aria-label="Panel ROPS" className="w-64 shrink-0 bg-sidebar p-6 text-sidebar-foreground">
        <p className="font-display text-h4 font-bold">Panel ROPS</p>
        <p className="mt-1 text-sm">{user.profile?.display_name ?? user.email}</p>
        <div className="mt-6 [&_button]:text-sidebar-foreground">
          <SignOutButton />
        </div>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
