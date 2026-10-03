import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/auth";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");

  return (
    <>
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 sm:px-8">
          <p className="py-3 text-sm text-muted-foreground">
            {user.profile?.display_name ?? user.email}
          </p>
          <SignOutButton />
        </div>
      </div>
      {children}
    </>
  );
}
