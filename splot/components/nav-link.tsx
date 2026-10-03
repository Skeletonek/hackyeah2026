"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Link that marks the current page with `aria-current="page"`; style the
 * active state with `aria-[current=page]:…` classes.
 */
export function NavLink({
  href,
  exact = false,
  className,
  children,
}: {
  href: string;
  /** Match only the exact path (for section roots like `/account`). */
  exact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(className)}>
      {children}
    </Link>
  );
}
