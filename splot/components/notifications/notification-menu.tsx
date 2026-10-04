"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/dates";
import { markNotificationsRead } from "@/lib/notifications/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  title: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

const PLURAL = new Intl.PluralRules("pl-PL");

/** „1 nowe”, „3 nowe”, „5 nowych”: the count in words, never only a dot. */
function unreadLabel(count: number) {
  const form = PLURAL.select(count);
  return `${count} ${form === "one" || form === "few" ? "nowe" : "nowych"}`;
}

export function NotificationMenu({
  userId,
  items,
  unreadCount,
  showWhenEmpty,
}: {
  userId: string;
  items: NotificationItem[];
  unreadCount: number;
  showWhenEmpty: boolean;
}) {
  const router = useRouter();
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // A new row refreshes the header, so the counter and the list update.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const title = (payload.new as { title?: string }).title;
          if (title) setAnnouncement(`Nowe powiadomienie: ${title}`);
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  function openItem(item: NotificationItem) {
    setOpen(false);
    if (!item.read_at) void markNotificationsRead(item.id);
  }

  function markAllRead() {
    setError("");
    startTransition(async () => {
      const result = await markNotificationsRead();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAnnouncement("Oznaczono wszystkie powiadomienia jako przeczytane.");
      // The button disappears with the last unread one; focus stays in the panel.
      headingRef.current?.focus();
    });
  }

  const liveRegion = (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );

  if (items.length === 0 && !showWhenEmpty) return liveRegion;

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border-2 border-input bg-card px-3 text-sm font-bold text-foreground hover:bg-muted simple:min-h-16"
          >
            <Bell aria-hidden size={20} strokeWidth={2} />
            <span className="sr-only sm:not-sr-only">Powiadomienia</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-saffron px-2 text-on-saffron">
                <span className="sr-only">, </span>
                {unreadLabel(unreadCount)}
              </span>
            )}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            collisionPadding={16}
            aria-labelledby={headingId}
            className="z-50 flex max-h-(--radix-popover-content-available-height) w-[min(26rem,calc(100vw-2rem))] flex-col gap-3 overflow-y-auto rounded-lg border-2 border-border bg-popover p-4 text-base text-popover-foreground shadow-lg"
          >
            <h2 id={headingId} ref={headingRef} tabIndex={-1} className="font-display text-h4 font-bold">
              Powiadomienia
            </h2>

            {items.length === 0 ? (
              <p className="text-muted-foreground">
                Nie masz jeszcze powiadomień. Tu zobaczysz odpowiedzi ROPS i zmiany statusu Twoich zgłoszeń.
              </p>
            ) : (
              <ul className="-mx-2 flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.link}
                      onClick={() => openItem(item)}
                      className="group flex min-h-11 flex-col gap-0.5 rounded-md px-2 py-2 hover:bg-muted simple:min-h-16"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className={cn("underline-offset-4 group-hover:underline", !item.read_at && "font-bold")}>
                          {item.title}
                        </span>
                        {!item.read_at && (
                          <span className="shrink-0 rounded-full bg-secondary px-2 text-sm font-bold text-secondary-foreground">
                            <span className="sr-only">, </span>
                            Nowe
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        <span className="sr-only">, </span>
                        {formatDate(item.created_at)}, {formatTime(item.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {unreadCount > 0 && (
              <Button variant="outline" size="sm" loading={pending} onClick={markAllRead} className="self-start">
                Oznacz jako przeczytane
              </Button>
            )}
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {liveRegion}
    </>
  );
}
