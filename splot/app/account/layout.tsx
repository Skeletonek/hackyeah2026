import { AccountNav } from "@/components/account-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");

  return (
    <>
      <SiteHeader />
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-4 px-4 sm:px-8">
          <AccountNav />
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="py-3 text-sm text-muted-foreground simple:text-simple-sm">
              {user.profile?.display_name ?? user.email}
            </p>
            <SignOutButton />
          </div>
        </div>
      </div>
      {children}
      <SiteFooter />
    </>
  );
}
