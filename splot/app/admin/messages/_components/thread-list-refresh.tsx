"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeAsUser } from "@/lib/supabase/realtime";

/**
 * Keeps the thread inbox current: any new message re-renders the list, so the
 * order and „Czeka na odpowiedź” follow the conversation. RLS limits the
 * events to admins.
 */
export function ThreadListRefresh() {
  const router = useRouter();

  useEffect(
    () =>
      subscribeAsUser((supabase) =>
        supabase
          .channel("admin-threads")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () =>
            router.refresh(),
          ),
      ),
    [router],
  );

  return null;
}
