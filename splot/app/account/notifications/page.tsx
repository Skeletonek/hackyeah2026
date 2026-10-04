import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { pageHref, pageRange, parsePage, toPage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const TITLE = "Powiadomienia";

export const metadata: Metadata = { title: TITLE };

const href = (page: number) => pageHref("/account/notifications", {}, page);

/** Every notification, newest first; the header bell shows only the latest 10. */
export default async function NotificationsPage({ searchParams }: PageProps<"/account/notifications">) {
  const user = await requireUser("/account/notifications");
  const page = parsePage(await searchParams);
  const supabase = await createClient();
  const result = await supabase
    .from("notifications")
    .select("id, title, link, read_at, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id")
    .range(...pageRange(page));
  const notifications = toPage(result, page, { label: "notifications list", href });

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>

      {notifications.total === 0 ? (
        <EmptyState title="Nie masz jeszcze powiadomień">
          Tu zobaczysz odpowiedzi ROPS i zmiany statusu Twoich zgłoszeń.
        </EmptyState>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {notifications.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.link}
                  className="group flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border-2 border-border bg-card p-4 hover:border-primary simple:min-h-16"
                >
                  <span className={cn("underline-offset-4 group-hover:underline", !item.read_at && "font-bold")}>
                    {item.title}
                  </span>
                  <span className="flex items-center gap-3 text-sm text-muted-foreground simple:text-simple-sm">
                    {!item.read_at && (
                      <span className="rounded-full bg-secondary px-2 font-bold text-secondary-foreground">
                        <span className="sr-only">, </span>
                        Nowe
                      </span>
                    )}
                    <span className="sr-only">, </span>
                    <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={notifications} href={href} label="Strony powiadomień" />
        </>
      )}
    </main>
  );
}
