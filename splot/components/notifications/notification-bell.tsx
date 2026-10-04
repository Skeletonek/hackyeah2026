import { NotificationMenu } from "@/components/notifications/notification-menu";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** KOM6 header bell: the latest 10 notifications and the unread count. */
export async function NotificationBell() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const [latest, unread] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, title, link, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  return (
    <NotificationMenu
      userId={user.id}
      items={latest.data ?? []}
      unreadCount={unread.count ?? 0}
      // Without an account the bell appears once something arrives.
      showWhenEmpty={!user.isAnonymous}
    />
  );
}
