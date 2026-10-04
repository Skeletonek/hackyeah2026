import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type BrowserClient = ReturnType<typeof createClient>;

/**
 * Subscribes to a Realtime channel as the signed-in user; returns the effect cleanup.
 *
 * On page load the session is still being read from cookies, and a channel that
 * joins before that joins as anon: it reports SUBSCRIBED, but RLS then drops every
 * event. So the user's token goes to Realtime first, and only then the channel joins.
 */
export function subscribeAsUser(build: (supabase: BrowserClient) => RealtimeChannel): () => void {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;
  let cancelled = false;

  void supabase.realtime.setAuth().then(() => {
    if (!cancelled) channel = build(supabase).subscribe();
  });

  return () => {
    cancelled = true;
    if (channel) void supabase.removeChannel(channel);
  };
}
